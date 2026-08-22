(() => {
  "use strict";

  function downloadCanvasAsPng(canvas, filename) {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = filename.replace(/[\\/:*?"<>|]/g, "-");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function drawCanvasSoulMark(context, x, y, size) {
    context.save();
    context.translate(x, y);
    context.scale(size / 64, size / 64);
    const background = context.createLinearGradient(5, 4, 59, 61);
    background.addColorStop(0, "#7665d7");
    background.addColorStop(.58, "#9a7ce5");
    background.addColorStop(1, "#e89bb4");
    context.fillStyle = background;
    drawCanvasRoundedRectPath(context, 3, 3, 58, 58, 18);
    context.fill();
    context.fillStyle = "#fff4b3";
    context.beginPath();
    context.moveTo(49, 12);
    context.lineTo(50.5, 15.5);
    context.lineTo(54, 17);
    context.lineTo(50.5, 18.5);
    context.lineTo(49, 22);
    context.lineTo(47.5, 18.5);
    context.lineTo(44, 17);
    context.lineTo(47.5, 15.5);
    context.closePath();
    context.fill();
    const ghost = context.createLinearGradient(22, 15, 42, 51);
    ghost.addColorStop(0, "#fffefc");
    ghost.addColorStop(1, "#f3eaff");
    context.fillStyle = ghost;
    context.beginPath();
    context.moveTo(18, 47);
    context.lineTo(18, 31);
    context.bezierCurveTo(18, 21, 24, 14, 32, 14);
    context.bezierCurveTo(40, 14, 46, 21, 46, 31);
    context.lineTo(46, 47);
    context.bezierCurveTo(46, 50, 43, 51, 41, 49);
    context.lineTo(39, 47);
    context.lineTo(35.5, 50);
    context.bezierCurveTo(34, 51.3, 32.7, 50.7, 32, 49.7);
    context.lineTo(30, 47);
    context.lineTo(27, 50);
    context.bezierCurveTo(25.4, 51.2, 24, 50.5, 23.3, 49.5);
    context.lineTo(22, 48);
    context.bezierCurveTo(20.3, 50, 18, 49, 18, 47);
    context.fill();
    context.fillStyle = "#403854";
    context.beginPath();
    context.arc(27.2, 31, 2.8, 0, Math.PI * 2);
    context.arc(36.8, 31, 2.8, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#6f6188";
    context.lineWidth = 1.5;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(29.5, 37.2);
    context.quadraticCurveTo(32, 39.2, 34.5, 37.2);
    context.stroke();
    context.fillStyle = "rgba(243,164,184,.72)";
    context.beginPath();
    context.arc(23.2, 36, 2.2, 0, Math.PI * 2);
    context.arc(40.8, 36, 2.2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawCanvasAppIcon(context, x, y, size, imageCache) {
    const image = imageCache?.get("icons/icon-v3.png");
    if (!image?.complete || !image.naturalWidth) {
      drawCanvasSoulMark(context, x, y, size);
      return;
    }
    context.save();
    drawCanvasRoundedRectPath(context, x, y, size, size, size * .24);
    context.clip();
    context.drawImage(image, x, y, size, size);
    context.restore();
  }

  function colorMixForCanvas(hex, opacity) {
    const match = String(hex).match(/^#([0-9a-f]{6})$/i);
    if (!match) return `rgba(143,122,234,${opacity})`;
    const value = Number.parseInt(match[1], 16);
    return `rgba(${value >> 16},${value >> 8 & 255},${value & 255},${opacity})`;
  }

  function drawCanvasCard(context, x, y, width, height, fill, stroke) {
    drawCanvasRoundedRectPath(context, x, y, width, height, 22);
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke;
    context.lineWidth = 1;
    context.stroke();
  }

  function drawCanvasPill(context, x, y, width, height, text, fill, color) {
    drawCanvasRoundedRectPath(context, x, y, width, height, height / 2);
    context.fillStyle = fill;
    context.fill();
    context.fillStyle = color;
    context.font = "700 16px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, x + width / 2, y + height / 2);
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
  }

  function drawCanvasProgress(context, x, y, width, percent, color) {
    context.fillStyle = "#eeebf2";
    drawCanvasRoundedRectPath(context, x, y, width, 10, 5);
    context.fill();
    context.fillStyle = color;
    drawCanvasRoundedRectPath(context, x, y, Math.max(4, width * percent / 100), 10, 5);
    context.fill();
  }

  function drawCanvasSticker(context, image, x, y, size) {
    context.save();
    context.fillStyle = "#fff";
    drawCanvasRoundedRectPath(context, x, y, size, size, 18);
    context.fill();
    context.clip();
    context.drawImage(image, x, y, size, size);
    context.restore();
  }

  function drawCanvasRoundedRectPath(context, x, y, width, height, radius) {
    const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.lineTo(x + width - safeRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    context.lineTo(x + width, y + height - safeRadius);
    context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    context.lineTo(x + safeRadius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    context.lineTo(x, y + safeRadius);
    context.quadraticCurveTo(x, y, x + safeRadius, y);
    context.closePath();
  }

  function drawCanvasText(context, text, x, y, maxWidth, lineHeight, maxLines) {
    const characters = [...String(text || "")];
    const lines = [];
    let line = "";
    characters.forEach((character) => {
      const candidate = line + character;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line);
    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines && visible.length) {
      let last = visible[visible.length - 1];
      while (last && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      visible[visible.length - 1] = `${last}…`;
    }
    visible.forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
  }

  globalThis.ASOUL_CANVAS_UTILS = Object.freeze({
    colorMixForCanvas,
    downloadCanvasAsPng,
    drawCanvasAppIcon,
    drawCanvasCard,
    drawCanvasPill,
    drawCanvasProgress,
    drawCanvasRoundedRectPath,
    drawCanvasSticker,
    drawCanvasText,
  });
})();
