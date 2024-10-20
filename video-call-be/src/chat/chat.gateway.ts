import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    console.log('Client connected: ', client.id);
    // Emit a user-connected event
    client.broadcast.emit('user-connected', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected: ', client.id);

    // Emit a user-disconnected event
    client.broadcast.emit('user-disconnected', client.id);
  }

  @SubscribeMessage('call-user')
  handleCallUser(
    client: Socket,
    data: { callerID: string; userID: string; offer: any },
  ) {
    console.log(`call-user event from ${data.callerID} to ${data.userID}`);
    client.to(data.userID).emit('call-made', {
      offer: data.offer,
      callerID: data.callerID,
    });
  }

  @SubscribeMessage('make-answer')
  handleMakeAnswer(
    client: Socket,
    data: { calleeID: string; callerID: string; answer: any },
  ) {
    console.log(`make-answer event from ${data.calleeID} to ${data.callerID}`);
    client.to(data.callerID).emit('answer-made', {
      answer: data.answer,
      calleeID: data.calleeID,
    });
  }

  @SubscribeMessage('reject-call')
  handleRejectCall(
    client: Socket,
    data: { calleeID: string; callerID: string },
  ) {
    console.log('call ended');

    console.log(`reject-call event from ${data.calleeID} to ${data.callerID}`);
    client.to(data.callerID).emit('call-rejected', {
      calleeID: data.calleeID,
    });
  }
}
