import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  transports: ['websocket', 'polling'],
  wssEngine: ['ws', 'wss'],
  path: '/socket.io',
  cors: {
    origin: '*',
  },
})
export class VideoGateway {
  @WebSocketServer()
  server: Server;
  private activeUsers: Map<string, string> = new Map();

  afterInit(server: Server) {
    console.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    client.on('register', (userId: string) => {
      this.activeUsers.set(userId, client.id);
    });
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
    this.activeUsers.forEach((socketId, userId) => {
      if (socketId === client.id) {
        this.activeUsers.delete(userId);
      }
    });
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: string): void {
    this.server.emit('message', message);
  }

  @SubscribeMessage('send-message')
  handleSendMessage(
    client: Socket,
    data: { toUserId: string; message: string },
  ) {
    console.log(
      `Message from ${client.id} to ${data.toUserId}: ${data.message}`,
    );

    const targetSocketId = this.activeUsers.get(data.toUserId);
    console.log('targetSocketId', targetSocketId);

    if (targetSocketId) {
      // Send the message to the specific user
      this.server.to(targetSocketId).emit('private-message', {
        from: client.id, // Sender socket ID
        message: data.message,
      });
    } else {
      console.log('User not connected');
    }
  }

  @SubscribeMessage('make-call')
  async handleCallUser(
    client: Socket,
    data: {
      callerId: string;
      callerName: string;
      callerImage?: string;
      receiverId: string;
      token: string;
      offer: any;
    },
  ) {
    console.log(`call-user event from ${data.callerId} to ${data.receiverId}`);

    const targetSocketId = this.activeUsers.get(data.receiverId);
    console.log('make-call-targetSocketId', targetSocketId);

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('new-call', {
        callerId: data.callerId,
        offer: data.offer,
        callerName: data.callerName,
        callerImage: data.callerImage,
      });
    } else {
      client.emit('call-error', { message: 'User not connected' });
      console.log('User not connected');
    }
  }

  @SubscribeMessage('answer-call')
  handleMakeAnswer(client: Socket, data: { callerId: string; sdpAnswer: any }) {
    console.log(`make-answer event from receiever to ${data.callerId}`);

    const targetSocketId = this.activeUsers.get(data.callerId);
    console.log('answer-call-targetSocketId', targetSocketId);

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('call-answered', {
        callerId: data.callerId,
        sdpAnswer: data.sdpAnswer,
      });
    } else {
      client.emit('call-error', { message: 'User not connected' });
      console.log('User not connected');
    }
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    client: Socket,
    data: { receiverId: string; iceCandidate: any },
  ) {
    const targetSocketId = this.activeUsers.get(data.receiverId);
    console.log('ice-candidate-targetSocketId', targetSocketId);

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('ice-candidate', {
        iceCandidate: data.iceCandidate,
      });
    } else {
      client.emit('call-error', { message: 'User not connected' });
      console.log('User not connected');
    }
  }

  @SubscribeMessage('reject-call')
  handleRejectCall(
    client: Socket,
    data: { receiverId: string; callerId: string },
  ) {
    console.log(
      `reject-call event from ${data.receiverId} to ${data.callerId}`,
    );

    const targetSocketId = this.activeUsers.get(data.callerId);
    console.log('Target caller socketId:', targetSocketId);

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('call-rejected', {
        receiverId: data.receiverId,
      });
    } else {
      console.log('Caller is not connected');
    }
  }

  @SubscribeMessage('end-call')
  handleEndCall(
    client: Socket,
    data: { callerId: string; receiverId: string },
  ) {
    console.log(`end-call event from ${client.id}`);

    const callerSocketId = this.activeUsers.get(data.callerId);
    const receiverSocketId = this.activeUsers.get(data.receiverId);

    if (callerSocketId) {
      this.server.to(callerSocketId).emit('call-ended', {
        by: client.id === callerSocketId ? 'caller' : 'receiver',
      });
    }

    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('call-ended', {
        by: client.id === receiverSocketId ? 'receiver' : 'caller',
      });
    }
  }
}
