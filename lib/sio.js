import socketIO from 'socket.io';
/**
 * Creates a new SocketIO object setup for
 * Project RRB.
 *
 * @class SIO
 */
class SIO {
  /**
   * Creates an instance of SIO.
   * @param {any} server
   * @memberof SIO
   */
  constructor(server) {
    this.io = socketIO(server);
    this.sockets = [];

    // Obj that holds array of rooms
    this.rooms = {};
  }

  connect() {
    this.io.on('connection', (socket) => {
      /**
       * Helpers
       */
      function log() {
        const array = [ 'Message from server:', ];
        array.push.apply(array, arguments);
        socket.emit('log', array);
      }
      // I dont see this being used o-o
      // Const sockets = [];
      socket.on('join room', (data) => {
        socket.join(data.room);

        // Only add users when they call join
        if (data.room) {
          // If data.room exists add more
          if (this.rooms[data.room]) {
            this.rooms[data.room] = [ ...this.rooms[data.room], { id: socket.id, user: data.user, }, ];
          }

          // If not make a new array
          else {
            this.rooms[data.room] = [ { id: socket.id, user: data.user, }, ];
          }
          socket.to(data.room).emit('add-users', { users: this.rooms[data.room], });
        }
      });

      socket.on('add-users', (data) => {
        socket.to(data.room).emit('add-users', {
          users: this.rooms[data.room],
          user: data.username,
        });
      });

      socket.on('make-offer', (data) => {
        socket.to(data.to).emit('offer-made', {
          offer: data.offer,
          socket: socket.id,
        });
      });

      socket.on('make-answer', (data) => {
        socket.to(data.to).emit('answer-made', {
          socket: socket.id,
          answer: data.answer,
          user: data.user,
        });
      });

      socket.on('disconnect', (data) => {
        const arrOfKeys = Object.keys(this.rooms);
        for (const key in arrOfKeys) {
          this.rooms[arrOfKeys[key]] = this.rooms[arrOfKeys[key]].filter(
            (user) => {
              return user.id !== socket.id;
            }
          );
        }
        socket.emit('remove-user', socket.id);
        socket.broadcast.emit('remove-user', socket.id);
      });

      socket.on('leave room', (data) => {
        const arrOfKeys = Object.keys(this.rooms);
        for (const key in arrOfKeys) {
          this.rooms[arrOfKeys[key]] = this.rooms[arrOfKeys[key]].filter(
            (user) => {
              return user.id !== socket.id;
            }
          );
        }
        socket.emit('remove-user', socket.id);
        socket.broadcast.emit('remove-user', socket.id);

        socket.leave(data.room);
      });
      socket.on('code msg', (data) => {
        socket.to(data.room).emit('code msg sent back to clients', data.msg);
      });

      socket.on('word msg', (data) => {
        socket.to(data.room).emit('word msg sent back to clients', data.msg);
      });

      socket.on('whiteBoard msg', (data) => {
        socket.to(data.room).emit('whiteBoard msg sent back to clients', data.msg);
      });
    });
  }
}

module.exports = SIO;