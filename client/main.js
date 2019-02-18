// code that is only sent to the client

// subscribe to read data
Meteor.subscribe("chats");
Meteor.subscribe("users");

// set up the main template (iron router) to the router will use to build pages
Router.configure({
  layoutTemplate: 'ApplicationLayout'
});

// specify the top level route, the page users see when they arrive at the site
Router.route('/', function () {
  console.log("rendering root /");
  this.render("navbar", {to:"header"});
  this.render("lobby_page", {to:"main"});  
});

// specify a route that allows the current user to chat to another users
Router.route('/chat/:_id', function () {
  // the user they want to chat to has id equal to 
  // the id sent in after /chat/... 
  var otherUserId = this.params._id;
  // find a chat that has two users that match current user id
  // and the requested user id

  var filter = {$or:[
                    {user1Id:Meteor.userId(), user2Id:otherUserId}, 
                    {user2Id:Meteor.userId(), user1Id:otherUserId}
               ]};
  var chat = Chats.findOne(filter);
  var chatId = "";

  if (!chat){// no chat matching the filter - need to insert a new one
    Meteor.call("addChat", Meteor.userId(), otherUserId, function(error, answer) { // Meteor.userId()
      chatId = result;
    });
  } else {// there is a chat going already - use that. 
    chatId = chat._id;
  }
  if (chatId) { // looking good, save the id to the session
     console.log("chatId received");
     Session.set("chatId", chatId);            
  }
  this.render("navbar", {to:"header"});
  this.render("chat_page", {to:"main"});  
});

///
/// Helper functions 
/// 
Template.available_user_list.helpers({
  users:function(){
    return Meteor.users.find();
  }
})

Template.available_user.helpers({
  // get current username by the id
  getUsername:function(userId){
    user = Meteor.users.findOne({_id:userId});
    return user.profile.username;
  },
  // to validate the current user
  isMyUser:function(userId){
    if (userId == Meteor.userId()){
      return true;
    } else {
      return false;
    }
  }
})

Template.chat_page.helpers({
  // retrieve the message from the current chat
  messages:function(){
    var chat = Chats.findOne({_id:Session.get("chatId")});
    console.log(chat);
    if (chat) {
      return chat.messages;
    } else {
      return;
    }
  },
  // the message from te other user on the current chat
  other_user:function(){
    return "";
  },
})

///
/// Events functions 
///

Template.available_user.events({   
  // this event fires when the user clic on another user to chat without login
  "click .js-user-chat":function(event) {
    if (!Meteor.user()){// user not available
	    // stop the form from triggering a page reload
	    event.preventDefault();
    	alert("You need to login first!");
    }
  }
});

Template.chat_page.events({
  // this event fires when the user sends a message on the chat page
  "submit .js-send-chat":function(event) {
    // stop the form from triggering a page reload
    event.preventDefault();

    // see if we can find a chat object in the database
    // to which we'll add the message
    var chat = Chats.findOne({_id:Session.get("chatId")});
    var curUserId = Meteor.user()._id;

    if (chat) {// ok - we have a chat to use
      if (curUserId == chat.user1Id) {
        otherUserId = chat.user2Id;
      } else {
        otherUserId = chat.user1Id;
      }

      curUser = Meteor.users.findOne({_id:curUserId});
      otherUser = Meteor.users.findOne({_id:otherUserId});
      sender = curUser.profile.username + " to " + otherUser.profile.username + " said: ";
      avatar = curUser.profile.avatar;

      var msgs = chat.messages; // The chat object, pull the messages property
      console.log("msgs:"+msgs);
      if (!msgs) { // Not True = No messages. Create a new array
        msgs = [];
      }

      // push adds the message to the end of the array
      msgs.push({text: event.target.chat.value, sender: sender, avatar: avatar});
      // reset the form
      event.target.chat.value = "";
      // Put the messages array onto the chat object
      chat.messages = msgs;
      // Update the chat object in the database.
      Meteor.call("editChat",chat._id, chat);
    }
  }
});
