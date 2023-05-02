const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://Dark:Sudeep2001@dark.k7j3zvm.mongodb.net/todolistDB"
);

const itemSchema = mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to my todolist!",
});
const item2 = new Item({
  name: "To add new notes press + buton",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const newList = mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const newListItem = mongoose.model("newListItem", newList);

async function itemInsert() {
  try {
    await Item.insertMany(defaultItems);
    console.log("successfully added to DB");
  } catch (err) {
    console.error(err);
  }
}

// itemInsert();

app.get("/", function (req, res) {
  // const day = date.getDate();

  async function findItems() {
    try {
      const foundItems = await Item.find({});

      if (foundItems.length === 0) {
        itemInsert();
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    } catch (err) {
      console.error(err);
    }
  }
  findItems();
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    newListItem
      .findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.err(err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  async function deleteItems() {
    try {
      if (listName === "Today") {
        await Item.deleteOne({ _id: checkedItemId });
        console.log("Successfully delete item");
        res.redirect("/");
      } else {
        await newListItem
          .findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemId } } }
          )
          .then(function (foundList) {
            res.redirect("/" + listName);
          })
          .catch(function (err) {
            console.error(err);
          });
      }
    } catch (err) {
      console.log(err);
    }
  }
  deleteItems();
});

app.get("/:newList", function (req, res) {
  const newListname = _.capitalize(req.params.newList);

  newListItem
    .findOne({ name: newListname })
    .then(function (foundlistitems) {
      if (foundlistitems) {
        res.render("list", {
          listTitle: foundlistitems.name,
          newListItems: foundlistitems.items,
        });
      } else {
        const list = new newListItem({
          name: newListname,
          items: defaultItems,
        });
        list
          .save()
          .then(() => {
            res.redirect("/" + newListname);
          })
          .catch((err) => {
            console.log(err);
            res.redirect("/");
          });
      }
    })
    .catch(function (err) {
      console.log(err);
      res.redirect("/");
    });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
