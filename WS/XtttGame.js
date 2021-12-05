// ----	--------------------------------------------	--------------------------------------------
// ----	--------------------------------------------	--------------------------------------------

// New player has joined
function onNewPlayer(data) {
  util.log('New player has joined: ' + data.name);

  // Create a new player
  var newPlayer = new Player(-1, data.name, 'looking');
  newPlayer.sockid = this.id;

  this.player = newPlayer;

  // Add new player to the players array
  players.push(newPlayer);
  players_avail.push(newPlayer);

  // util.log("looking for pair - uid:"+newPlayer.uid + " ("+newPlayer.name + ")");
  show_avail_players(players_avail);
  // pair_avail_players();

  // updAdmin("looking for pair - uid:"+p.uid + " ("+p.name + ")");

  // updAdmin("new player connected - uid:"+data.uid + " - "+data.name);
}

// ----	--------------------------------------------	--------------------------------------------

function show_avail_players(players_avail) {
  util.log('show_avail_players');

  players_avail.forEach((player) => {
    const avail_opps = [...players_avail].filter(
      (p) => p.sockid !== player.sockid && p.status === 'looking'
    );
    io.to(player.sockid).emit('avail_opps', {
      avail_opps: avail_opps,
    });
  });
}

function pair_avail_players() {
  if (players_avail.length < 2) return;

  var p1 = players_avail.shift();
  var p2 = players_avail.shift();

  p1.mode = 'm';
  p2.mode = 's';
  p1.status = 'paired';
  p2.status = 'paired';
  p1.opp = p2;
  p2.opp = p1;

  //util.log("connect_new_players p1: "+util.inspect(p1, { showHidden: true, depth: 3, colors: true }));

  // io.sockets.connected[p1.sockid].emit("pair_players", {opp: {name:p2.name, uid:p2.uid}, mode:'m'});
  // io.sockets.connected[p2.sockid].emit("pair_players", {opp: {name:p1.name, uid:p1.uid}, mode:'s'});
  io.to(p1.sockid).emit('pair_players', {
    opp: { name: p2.name, uid: p2.uid },
    mode: 'm',
  });
  io.to(p2.sockid).emit('pair_players', {
    opp: { name: p1.name, uid: p1.uid },
    mode: 's',
  });

  util.log(
    'connect_new_players - uidM:' +
      p1.uid +
      ' (' +
      p1.name +
      ')  ++  uidS: ' +
      p2.uid +
      ' (' +
      p2.name +
      ')'
  );
  // updAdmin("connect_new_players - uidM:"+p1.uid + " ("+p1.name + ")  ++  uidS: "+p2.uid + " ("+p2.name+")");
}

function new_pair_avail_players(p1, p2) {
  // if (players_avail.length < 2) return;

  // var p1 = players_avail.shift();
  // var p2 = players_avail.shift();

  p1.mode = 'm';
  p2.mode = 's';
  p1.status = 'paired';
  p2.status = 'paired';
  p1.opp = p2;
  p2.opp = p1;

  //util.log("connect_new_players p1: "+util.inspect(p1, { showHidden: true, depth: 3, colors: true }));

  // io.sockets.connected[p1.sockid].emit("pair_players", {opp: {name:p2.name, uid:p2.uid}, mode:'m'});
  // io.sockets.connected[p2.sockid].emit("pair_players", {opp: {name:p1.name, uid:p1.uid}, mode:'s'});
  io.to(p1.sockid).emit('pair_players', {
    opp: { name: p2.name, uid: p2.uid },
    mode: 'm',
  });
  io.to(p2.sockid).emit('pair_players', {
    opp: { name: p1.name, uid: p1.uid },
    mode: 's',
  });

  util.log(
    'connect_new_players - uidM:' +
      p1.uid +
      ' (' +
      p1.name +
      ')  ++  uidS: ' +
      p2.uid +
      ' (' +
      p2.name +
      ')'
  );
  // updAdmin("connect_new_players - uidM:"+p1.uid + " ("+p1.name + ")  ++  uidS: "+p2.uid + " ("+p2.name+")");
}

// ----	--------------------------------------------	--------------------------------------------

function onTurn(data) {
  //util.log("onGameLoadedS with qgid: "+data.qgid);

  io.to(this.player.opp.sockid).emit('opp_turn', { cell_id: data.cell_id });

  util.log(
    'turn  --  usr:' +
      this.player.mode +
      ' - :' +
      this.player.name +
      '  --  cell_id:' +
      data.cell_id
  );
  // updAdmin("Q answer - game - qgid:"+data.qgid + "  --  usr:"+this.player.mode + " - uid:"+this.player.uid + "  --  qnum:"+data.qnum + "  --  ans:"+data.ansnum);
}

// ----	--------------------------------------------	--------------------------------------------
// ----	--------------------------------------------	--------------------------------------------

// Socket client has disconnected
function onClientDisconnect() {
  // util.log("onClientDisconnect: "+this.id);

  var removePlayer = this.player;
  players.splice(players.indexOf(removePlayer), 1);
  players_avail.splice(players_avail.indexOf(removePlayer), 1);
  show_avail_players(players_avail);

  //   io.to(players_avail[0].sockid).emit('opp_left', {
  //     msg: 'Your opponent has disconnected...',
  //   });

  if (this.status == 'admin') {
    util.log('Admin has disconnected: ' + this.uid);
    //		updAdmin("Admin has disconnected - uid:"+this.uid + "  --  "+this.name);
  } else {
    util.log('Player has disconnected: ' + this.id);
    //		updAdmin("player disconnected - uid:"+removePlayer.uid + "  --  "+removePlayer.name);
  }
}

function handleAsk(data) {
  util.log('ask request sent to sockid: ' + data.send_to_sockid);
  const requestFromPlayer = this.player;
  const player2 = players_avail.find((p) => p.sockid === data.send_to_sockid);
  matching_games.push({ p1: requestFromPlayer, p2: player2 });
  io.to(data.send_to_sockid).emit('forward_ask', {
    requestFromPlayer: requestFromPlayer,
  });
}

function handleReject(data) {
  util.log('reject sent to sockid: ' + data.send_to_sockid);
  const rejectFromPlayer = this.player;
  io.to(data.send_to_sockid).emit('forward_reject', {
    rejectFromPlayer: rejectFromPlayer,
  });
}

function handleAccept(data) {
  util.log('accept sent to sockid: ' + data.send_to_sockid);
  const acceptFromPlayer = this.player;
  const oppoPlayer = players_avail.find(
    (p) => p.sockid === data.send_to_sockid
  );
  new_pair_avail_players(oppoPlayer, acceptFromPlayer);
  show_avail_players(players_avail);
  // const rejectFromPlayer = this.player;
  // io.to(data.send_to_sockid).emit('forward_reject', {
  //   rejectFromPlayer: rejectFromPlayer,
  // });
}

// ----	--------------------------------------------	--------------------------------------------
// ----	--------------------------------------------	--------------------------------------------

// ----	--------------------------------------------	--------------------------------------------
// ----	--------------------------------------------	--------------------------------------------

set_game_sock_handlers = function (socket) {
  // util.log("New game player has connected: "+socket.id);

  socket.on('new player', onNewPlayer);

  socket.on('ply_turn', onTurn);

  socket.on('disconnect', onClientDisconnect);

  socket.on('send_ask', handleAsk);

  socket.on('send_reject', handleReject);

  socket.on('send_accept', handleAccept);
};
