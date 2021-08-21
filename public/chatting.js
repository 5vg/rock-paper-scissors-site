var sock = io();
sock.on('msg', onChatMessage);

function onChatMessage(msg) {
  var ul = document.querySelector('#chat');
  var item = document.createElement('li');
  item.innerHTML = msg;
  ul.appendChild(item);
}

function sendChatMessage(e) {
  e.preventDefault();

  var inp = document.querySelector('#chat-form input');
  var msg = inp.value;
  inp.value = '';

  sock.emit('msg', msg);
}

(function init() {
  var form = document.querySelector('#chat-form');
  form.addEventListener('submit', sendChatMessage);

  ['rock', 'paper', 'scissors'].forEach(function (figure) {
    var btn = document.getElementById(figure);
    btn.addEventListener('click', function () {
      sock.emit('turn', figure);
    });
  });
})();
