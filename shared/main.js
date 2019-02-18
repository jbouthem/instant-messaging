// code that is shared between client and server, i.e. sent to both

// method definitions
Meteor.methods({
  //methods to add a new chat message
  "addChat":function(user1,user2){
    console.log("adding");
    chatId = Chats.insert({user1Id:user1, user2Id:user2});
    return chatId;
  },

  "editChat":function(chatid, chat){
    console.log("in method call");
    Chats.update(chatid, chat);
  }
});