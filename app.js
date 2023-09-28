// Import necessary packages and libraries
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");

// Connect to MongoDB Atlas
async function connectToMongoose() {
  try {
    await mongoose.connect("mongodb+srv://tzufae:1515@cluster0.y4qvlov.mongodb.net/todolist", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB Atlas connection successful");
  } catch (error) {
    console.error("MongoDB Atlas connection failed:", error);
  }
}

// Export the connection function
module.exports = connectToMongoose;

// Define a schema for the "Item" collection in MongoDB
const ItemSchema = new mongoose.Schema({
  name: String,
});

// Create a model based on the ItemSchema
const Item = mongoose.model("Item", ItemSchema);

// Define some default items
const item1 = new Item({
  name: "Brush Teeth",
});

const item2 = new Item({
  name: "Push ups",
});

const item3 = new Item({
  name: "Read book",
});

// Store default items in an array
const defaultItems = [item1, item2, item3];

// Define a schema for the "List" collection in MongoDB
const listSchema = {
  name: String,
  items: [ItemSchema],
};

// Create a model based on the listSchema
const List = mongoose.model("List", listSchema);

// Function to insert default items into the database
async function insertDefaultItems() {
  try {
    await Item.insertMany(defaultItems);
    console.log("Default items inserted successfully!");
  } catch (err) {
    console.error("Error inserting default items:", err);
  }
}

// Function to start the application, including database connection
async function startApp() {
  try {
    await connectToMongoose();
  } catch (error) {
    console.error("Connection to MongoDB failed:", error);
  }
}

// Call the function to start the application
startApp();

// Configure the view engine to use EJS
app.set("view engine", "ejs");

// Configure the app to use middleware for parsing requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Define a route to handle the root URL ("/")
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
    console.error("Error finding all items:", error);
  }
});

// Define a route to handle POST requests (for adding items)
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
    console.error("Error handling POST request:", error);
  }
});

// Define a route to handle item deletion
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
    console.error("Error handling item deletion:", error);
  }
});

// Define a route to handle custom lists
app.get("/:customListName", async (req, res) => {
  try {
    const customListName = _.capitalize(req.params.customListName);
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
    console.error("Error handling custom list:", error);
  }
});

// Start the server on the specified port (3000 or the one provided by the environment)
app.listen(process.env.PORT || 3000, function () {
  console.log("Server is running on port 3000");
});