const express = require('express');
const router = express.Router();

// Importa il controller delle amicizie
const friendsController = require('../controllers/friends.js');

// GET /friends
router.get('/', (req, res) => {
  res.send('Router per la gestione delle amicizie');
});

// POST /users/addFriend 
router.post('/addFriend',friendsController.addFriend);

// POST /users/acceptRequest 
router.post('/acceptRequest',friendsController.acceptRequest);

// POST /users/rejectRequest 
router.post('/rejectRequest',friendsController.rejectRequest);

// POST /friends/friendList 
router.post('/friendList',friendsController.friendList);

// POST /friends/deleteFriend
router.post('/deleteFriend',friendsController.deleteFriend);

// POST /friends/chatHandler 
router.post('/chatHandler',friendsController.chatHandler);

// POST /friends/messageSubmit 
router.post('/messageSubmit',friendsController.messageSubmit);

module.exports = router;