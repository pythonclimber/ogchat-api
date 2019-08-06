module.exports = function(io) {    
    let exports = {};
    const Message = require('../models/message');
    const Conversation = require('../models/conversation');
    const User = require('../models/user');

    exports.getMessages = function(req, res) {
        let pageNumber = parseInt(req.query.pageNumber);
        if (!pageNumber) {
            pageNumber = 0;
        }
        Message.find({createdAt: {$gt: new Date(Date.now() - (14 * 24 * 60 * 60 * 1000))}})
            .sort("-createdAt")
            .skip(pageNumber * 25)
            .limit(25)
            .exec((err, messages) => {
            
            if (err) {
                return console.error(err);
            }

            messages = messages.sort((msg1, msg2) => {
                if (msg1.createdAt.getTime() < msg2.createdAt.getTime()) {
                    return -1;
                } else if (msg1.createdAt.getTime() > msg2.createdAt.getTime()) {
                    return 1;
                } else {
                    return 0;
                }
            });

            return res.send(this.mapMessage);
        });
    };

    exports.createMessage = function(req, res) {
        var message = new Message({messageBody: req.body.messageBody, userId: req.body.userId});
        message.save();
        io.emit('chat-message', this.mapMessage(message));
        res.status(200).end();
    };

    exports.getAllMessages = function(req, res) {
        var userId = req.params.userId;
        Message.find({userId: {$eq: userId}}).exec((err, messages) => {
            if (err) {
                return console.error(err);
            }

            res.send(messages.map(this.mapMessage));
        });
    };

    exports.searchMessages = function(req, res) {
        var searchDate = req.body.searchDate;
        var searchText = req.body.searchText;

        if (searchDate) {
            var startDate = new Date(searchDate);
            var endDate = new Date(searchDate);
            endDate.setDate(endDate.getDate() + 1);
            Message.find({createdAt: {$gt: startDate, $lt: endDate}}).exec((error, messages) => {
                if (error) {
                    return console.error(error);
                }

                messages = messages.sort((msg1, msg2) => {
                    if (msg1.createdAt.getTime() < msg2.createdAt.getTime()) {
                        return -1;
                    } else if (msg1.createdAt.getTime() > msg2.createdAt.getTime()) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                res.send(messages.map(this.mapMessage));
            });
        } else if(searchText) {
            Message.find({messageBody: {$regex: searchText, $options: 'i'}}).exec((error, messages) => {
                if (error) {
                    return console.error(error);
                }

                messages = messages.sort((msg1, msg2) => {
                    if (msg1.createdAt.getTime() < msg2.createdAt.getTime()) {
                        return -1;
                    } else if (msg1.createdAt.getTime() > msg2.createdAt.getTime()) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                res.send(messages.map(this.mapMessage));
            });
        } else {
            res.send({error: 'Must provide search value'});
        }
    };

    exports.addMessage = (msg) => {
        var message = new Message({messageBody: msg.body, userId: msg.userId});
        message.save();
        io.emit('chat-message', this.mapMessage(message));
    };

    exports.getConversations = (req, res) => {
        var userId = req.params.userId;
        var conversations = [];
        Conversation.find({userId1: {$eq: userId}}).exec((err, convos1) => {
            if (err) {
                console.error(err);
                res.status(500);
            }

            conversations = conversations.concat(convos1);
            Conversation.find({userId2: {$eq: userId}}).exec((err, convos2) => {
                if (err) {
                    console.error(err);
                    res.status(500);
                }

                conversations = conversations.concat(convos2);
                res.send(conversations);
            });
        });
    };

    exports.getConversation = (req, res) => {
        var conversationId = req.params.conversationId;
        var result = {};
        Conversation.findById(conversationId).exec((err, conversation) => {
            if (err) {
                console.error(err);
                res.status(505);
            }

            result.conversationId = conversation.conversationId;
            result.userId1 = conversation.userId1;
            result.userId2 = conversation.userId2;
            User.findById(conversation.userId1).exec((err, user1) => {
                if (err) {
                    console.error(err);
                    res.status(505);
                }

                result.user1 = user1;

                User.findById(conversation.userId2).exec((err, user2) => {
                    if (err) {
                        console.error(err);
                        res.status(505);
                    }

                    result.user2 = user2;
                    res.send(result);
                });
            });
        });
    };

    exports.getConverationMessages = (req, res) => {
        var conversationId = req.params.conversationId;
        Message.find({conversationId: {$eq: conversationId}, createdAt: {$gt: new Date(Date.now() - (24 * 60 * 60 * 1000))}}).exec((err, messages) => {
            if (err) {
                console.error(err);
                res.status(500);
            }

            res.send(messages);
        });
    };

    exports.updateMessages = (req, res) => {
        Message.update({}, {conversationId: '5b44cacd8d864f80e854e266'}, {multi: true}, err => {
            if (err) {
                console.error(err);
                res.status(500);
            }

            res.send('done');
        });
    }

    exports.mapMessage = (message) => {
        return {
            body: message.messageBody,
            id: message._id,
            userId: message.userId,
            createdAt: message.conversationId
        };
    }

    return exports;
};