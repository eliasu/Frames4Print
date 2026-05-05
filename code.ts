figma.showUI(__html__, { width: 420, height: 620 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-frame') {
    const { widthPx, heightPx, bleed, bleedMm, widthMm, heightMm, multiplier } = msg;

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });

    const frame = figma.createFrame();
    frame.name = `Print — ${widthMm}×${heightMm}mm${bleed ? ` +${bleedMm}mm bleed` : ''}`;
    frame.resize(widthPx, heightPx);

    const center = figma.viewport.center;
    frame.x = center.x - widthPx / 2;
    frame.y = center.y - heightPx / 2;

    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    if (bleed) {
      const bleedPx = Math.round(bleedMm * multiplier);

      const fx = frame.x;
      const fy = frame.y;

      const guides: Guide[] = [
        { axis: 'X', offset: fx + bleedPx },
        { axis: 'X', offset: fx + widthPx - bleedPx },
        { axis: 'Y', offset: fy + bleedPx },
        { axis: 'Y', offset: fy + heightPx - bleedPx },
      ];

      const currentGuides = figma.currentPage.guides || [];
      figma.currentPage.guides = [...currentGuides, ...guides];
    }

    figma.ui.postMessage({ type: 'done' });
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
