figma.showUI(__html__, { width: 420, height: 500 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-frame') {
    const { widthPx, heightPx, bleed, bleedMm, widthMm, heightMm, trimWidthMm, trimHeightMm, multiplier } = msg;

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });

    const frame = figma.createFrame();
    frame.name = bleed
      ? `Print — ${trimWidthMm}×${trimHeightMm}mm + ${bleedMm}mm (${widthMm}×${heightMm}mm)`
      : `Print — ${widthMm}×${heightMm}mm`;
    frame.resize(widthPx, heightPx);

    const center = figma.viewport.center;
    frame.x = center.x - widthPx / 2;
    frame.y = center.y - heightPx / 2;

    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    if (bleed) {
      const bleedPx = Math.round(bleedMm * multiplier);

      frame.guides = [
        { axis: 'X', offset: bleedPx },
        { axis: 'X', offset: widthPx - bleedPx },
        { axis: 'Y', offset: bleedPx },
        { axis: 'Y', offset: heightPx - bleedPx },
      ];
    }

    figma.ui.postMessage({ type: 'done' });
  }

  if (msg.type === 'resize') {
    figma.ui.resize(420, msg.height);
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
