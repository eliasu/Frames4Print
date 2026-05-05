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
  bleedTopMm?: number;
  bleedRightMm?: number;
  bleedBottomMm?: number;
  bleedLeftMm?: number;
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
    const { widthPx, heightPx, bleed, bleedTopMm, bleedRightMm, bleedBottomMm, bleedLeftMm, widthMm, heightMm, trimWidthMm, trimHeightMm, multiplier, guides } = msg;

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });

    const frame = figma.createFrame();
    if (bleed) {
      const isUniform = bleedTopMm === bleedRightMm && bleedRightMm === bleedBottomMm && bleedBottomMm === bleedLeftMm;
      const bleedStr = isUniform ? `${bleedTopMm}mm` : `${bleedTopMm}/${bleedRightMm}/${bleedBottomMm}/${bleedLeftMm}mm`;
      frame.name = `Print — ${trimWidthMm}×${trimHeightMm}mm + ${bleedStr} (${widthMm}×${heightMm}mm)`;
    } else {
      frame.name = `Print — ${widthMm}×${heightMm}mm`;
    }
    frame.resize(widthPx!, heightPx!);

    const center = figma.viewport.center;
    frame.x = center.x - widthPx! / 2;
    frame.y = center.y - heightPx! / 2;

    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    const frameGuides: Guide[] = [];

    if (bleed) {
      frameGuides.push(
        { axis: 'X', offset: Math.round(bleedLeftMm! * multiplier!) },
        { axis: 'X', offset: widthPx! - Math.round(bleedRightMm! * multiplier!) },
        { axis: 'Y', offset: Math.round(bleedTopMm! * multiplier!) },
        { axis: 'Y', offset: heightPx! - Math.round(bleedBottomMm! * multiplier!) },
      );
    }

    if (guides && guides.length > 0) {
      for (const g of guides) frameGuides.push(g);
    }

    if (frameGuides.length > 0) frame.guides = frameGuides;

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
    const uniformBleed = name.match(/^Print — (\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)mm \+ (\d+(?:\.\d+)?)mm \((\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)mm\)$/);
    const perSideBleed = name.match(/^Print — (\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)mm \+ (\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)mm \((\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)mm\)$/);
    if (noBleed) {
      const trimW = parseFloat(noBleed[1]);
      const trimH = parseFloat(noBleed[2]);
      figma.ui.postMessage({
        type: 'selection-info', found: true, parseable: true, name,
        trimW, trimH, bleedMm: 0, bleedTopMm: 0, bleedRightMm: 0, bleedBottomMm: 0, bleedLeftMm: 0,
        totalW: trimW, totalH: trimH, frameWidth: node.width, frameHeight: node.height,
      });
    } else if (uniformBleed) {
      const trimW = parseFloat(uniformBleed[1]);
      const trimH = parseFloat(uniformBleed[2]);
      const bleedMm = parseFloat(uniformBleed[3]);
      const totalW = parseFloat(uniformBleed[4]);
      const totalH = parseFloat(uniformBleed[5]);
      figma.ui.postMessage({
        type: 'selection-info', found: true, parseable: true, name,
        trimW, trimH, bleedMm, bleedTopMm: bleedMm, bleedRightMm: bleedMm, bleedBottomMm: bleedMm, bleedLeftMm: bleedMm,
        totalW, totalH, frameWidth: node.width, frameHeight: node.height,
      });
    } else if (perSideBleed) {
      const trimW = parseFloat(perSideBleed[1]);
      const trimH = parseFloat(perSideBleed[2]);
      const bleedTopMm = parseFloat(perSideBleed[3]);
      const bleedRightMm = parseFloat(perSideBleed[4]);
      const bleedBottomMm = parseFloat(perSideBleed[5]);
      const bleedLeftMm = parseFloat(perSideBleed[6]);
      const totalW = parseFloat(perSideBleed[7]);
      const totalH = parseFloat(perSideBleed[8]);
      figma.ui.postMessage({
        type: 'selection-info', found: true, parseable: true, name,
        trimW, trimH, bleedMm: bleedTopMm, bleedTopMm, bleedRightMm, bleedBottomMm, bleedLeftMm,
        totalW, totalH, frameWidth: node.width, frameHeight: node.height,
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
      const uniformBleed = node.name.match(/\+ (\d+(?:\.\d+)?)mm \((\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)mm\)$/);
      const perSideBleed = node.name.match(/\+ (\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)mm \((\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)mm\)$/);
      if (uniformBleed || perSideBleed) {
        let tPx: number, rPx: number, bPx: number, lPx: number;
        if (uniformBleed) {
          const mult = node.width / parseFloat(uniformBleed[2]);
          tPx = rPx = bPx = lPx = parseFloat(uniformBleed[1]) * mult;
        } else {
          const mult = node.width / parseFloat(perSideBleed![5]);
          tPx = parseFloat(perSideBleed![1]) * mult;
          rPx = parseFloat(perSideBleed![2]) * mult;
          bPx = parseFloat(perSideBleed![3]) * mult;
          lPx = parseFloat(perSideBleed![4]) * mult;
        }
        const tol = 0.5;
        existing = existing.filter(g =>
          (g.axis === 'X' && (Math.abs(g.offset - lPx) < tol || Math.abs(g.offset - (node.width - rPx)) < tol)) ||
          (g.axis === 'Y' && (Math.abs(g.offset - tPx) < tol || Math.abs(g.offset - (node.height - bPx)) < tol))
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
