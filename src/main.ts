import './style.css'

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// Resize the canvas to match its display size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function loop() {
  requestAnimationFrame(loop);

  // Clear frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw test rect
  ctx.fillStyle = "red";
  ctx.fillRect(50, 50, 100, 100);

  // Draw test text
  ctx.fillStyle = "white";
  ctx.font = "24px sans-serif";
  ctx.fillText("linked", 60, 180);
}

loop();
