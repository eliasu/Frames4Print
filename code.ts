figma.showUI(__html__, { width: 420, height: 500 });

interface Guide {
  axis: 'X' | 'Y';
  offset: number;
}

figma.ui.onmessage = async (msg: {
  type: string;
  widthPx?: number;
  heightPx?: number;
  bleed?: boolean;
  bleedMm?: number;
  widthMm?: number;
  heightMm?: number;
  trimWidthMm?: number;
  trimHeightMm?: number;
  multiplier?: number;
  guides?: Guide[];
  removeExisting?: boolean;
  height?: number;
}) => {
  if (msg.type === 'create-frame') {
    const { widthPx, heightPx, bleed, bleedMm, widthMm, heightMm, trimWidthMm, trimHeightMm, multiplier, guides } = msg;

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });

    const frame = figma.createFrame();
    frame.name = bleed
      ? `Print — ${trimWidthMm}×${trimHeightMm}mm + ${bleedMm}mm (${widthMm}×${heightMm}mm)`
      : `Print — ${widthMm}×${heightMm}mm`;
    frame.resize(widthPx!, heightPx!);

    const center = figma.viewport.center;
    frame.x = center.x - widthPx! / 2;
    frame.y = center.y - heightPx! / 2;

    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    const frameGuides: Guide[] = [];

    if (bleed) {
      const bleedPx = Math.round(bleedMm! * multiplier!);
      frameGuides.push(
        { axis: 'X', offset: bleedPx },
        { axis: 'X', offset: widthPx! - bleedPx },
        { axis: 'Y', offset: bleedPx },
        { axis: 'Y', offset: heightPx! - bleedPx },
      );
    }

    if (guides && guides.length > 0) {
      for (const g of guides) {
        frameGuides.push(g);
      }
    }

    if (frameGuides.length > 0) {
      frame.guides = frameGuides;
    }

    figma.ui.postMessage({ type: 'done' });
  }

  if (msg.type === 'get-selection') {
    const sel = figma.currentPage.selection;
    if (sel.length !== 1 || sel[0].type !== 'FRAME') {
      figma.ui.postMessage({ type: 'selection-info', found: false });
      return;
    }
    const node = sel[0] as FrameNode;
    const name = node.name;
    const noBleed = name.match(/^Print — (\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)mm$/);
    const withBleed = name.match(/^Print — (\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)mm \+ (\d+(?:\.\d+)?)mm \((\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)mm\)$/);
    if (noBleed) {
      const trimW = parseFloat(noBleed[1]);
      const trimH = parseFloat(noBleed[2]);
      figma.ui.postMessage({
        type: 'selection-info', found: true, parseable: true, name,
        trimW, trimH, bleedMm: 0, totalW: trimW, totalH: trimH,
        frameWidth: node.width, frameHeight: node.height,
      });
    } else if (withBleed) {
      const trimW = parseFloat(withBleed[1]);
      const trimH = parseFloat(withBleed[2]);
      const bleedMm = parseFloat(withBleed[3]);
      const totalW = parseFloat(withBleed[4]);
      const totalH = parseFloat(withBleed[5]);
      figma.ui.postMessage({
        type: 'selection-info', found: true, parseable: true, name,
        trimW, trimH, bleedMm, totalW, totalH,
        frameWidth: node.width, frameHeight: node.height,
      });
    } else {
      figma.ui.postMessage({ type: 'selection-info', found: true, parseable: false, name });
    }
  }

  if (msg.type === 'apply-guides') {
    const { guides, removeExisting } = msg;
    const sel = figma.currentPage.selection;
    if (sel.length !== 1 || sel[0].type !== 'FRAME') return;
    const node = sel[0] as FrameNode;
    let existing: Guide[] = [...node.guides] as Guide[];
    if (removeExisting) {
      const withBleed = node.name.match(/\+ (\d+(?:\.\d+)?)mm \((\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)mm\)$/);
      if (withBleed) {
        const bleedMm = parseFloat(withBleed[1]);
        const totalW = parseFloat(withBleed[2]);
        const mult = node.width / totalW;
        const bleedPx = bleedMm * mult;
        const tol = 0.5;
        existing = existing.filter(g =>
          (g.axis === 'X' && (Math.abs(g.offset - bleedPx) < tol || Math.abs(g.offset - (node.width - bleedPx)) < tol)) ||
          (g.axis === 'Y' && (Math.abs(g.offset - bleedPx) < tol || Math.abs(g.offset - (node.height - bleedPx)) < tol))
        );
      } else {
        existing = [];
      }
    }
    node.guides = [...existing, ...(guides ?? [])] as typeof node.guides;
    figma.ui.postMessage({ type: 'apply-done' });
  }

  if (msg.type === 'resize') {
    figma.ui.resize(420, msg.height!);
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
