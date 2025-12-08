
(function addBadge(){
  if (document.getElementById('codehintai-badge')) return;
  const div = document.createElement('div');
  div.id = 'codehintai-badge';
  div.style = 'position:fixed;right:12px;bottom:12px;z-index:9999;background:#0b74de;color:white;padding:6px 8px;border-radius:8px;font-family:Arial;font-size:12px;cursor:pointer;';
  div.textContent = 'CodeHintAI';
  div.title = 'Click the extension icon for hints';
  div.onclick = () => {
    alert('Click the CodeHintAI extension icon (top-right) to open the hint popup.');
  };
  document.body.appendChild(div);
})();
