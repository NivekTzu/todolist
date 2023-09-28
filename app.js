//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _= require("lodash");

//connect to MongoDB
async function connectToMongoose() {
  try {
    await mongoose.connect("mongodb+srv://tzufae:1515@cluster0.y4qvlov.mongodb.net/todolist", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("success");
  } catch (error) {
    console.error("didnt work", error);
  }
}

module.exports = connectToMongoose;

const ItemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", ItemSchema);

const item1 = new Item({
  name: "Brush Teeth",
});

const item2 = new Item({
  name: "Push ups",
});

const item3 = new Item({
  name: "Read book",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [ItemSchema],
};
const List = mongoose.model("List", listSchema);


async function insertDefaultItems() {
  try {
    await Item.insertMany(defaultItems);
    console.log("Default items inserted successfully!");
  } catch (err) {
    console.error("Error inserting default items:", err);
  }
}
async function startApp() {
  try {
    await connectToMongoose();
  } catch (error) {
    console.error("connection to Mongo failed:", error);
  }
}
startApp();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  try {
    const allItems = await Item.find({});
    if (allItems.length === 0) {
      insertDefaultItems();
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "today", newListItems: allItems });
    }
  } catch (error) {
    console.error("error finding all Items", error);
  }
});

app.post("/", async (req, res) => {
  try {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
      name: itemName,
    });
    if (listName === "today") {
      await item.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        console.error("List not found.");
      }
    }
  } catch (error) {
    console.error("error posting", error);
  }
});

app.post("/delete", async (req, res) => {
  try {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "today") {
      await Item.findByIdAndRemove(checkedItemId);
      res.redirect("/");
    } else {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + listName);
    }
  } catch (error) {
    console.error("error", error);
  }
});

app.get("/:customListName", async (req, res) => {
  try {
    const customListName  = _.capitalize(req.params.customListName);
    const foundList = await List.findOne({ name: customListName });
    if (foundList === null) {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  } catch (error) {
    console.error("error", error);
  }
});
app.listen(process.env.PORT  || 3000, function(){
    console.log("server running port 3000");
});
