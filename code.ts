interface ColorData {
  r: number;
  g: number;
  b: number;
  hex: string;
}

interface PluginMessage {
  type: string;
  colors?: ColorData[];
  bytes?: number[];
  message?: string;
}

figma.showUI(__html__, { width: 280, height: 160 });

figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === 'extract') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({ type: 'error', message: 'Select an image frame first.' });
      return;
    }

    const node = selection[0];

    try {
      const bytes = await (node as any).exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 1 }
      });
      figma.ui.postMessage({ type: 'image', bytes: Array.from(bytes) });
    } catch {
      figma.ui.postMessage({ type: 'error', message: 'Cannot export selected node as image.' });
    }
  }

  if (msg.type === 'colors' && msg.colors) {
    await createSwatches(msg.colors);
  }
};

async function createSwatches(colors: ColorData[]) {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) return;
  const node = selection[0] as any;

  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  const frame = figma.createFrame();
  frame.name = 'Magic Swatches';
  frame.layoutMode = 'HORIZONTAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.itemSpacing = 0;
  frame.fills = [];
  frame.clipsContent = false;

  if (node.x !== undefined && node.y !== undefined && node.height !== undefined) {
    frame.x = node.x;
    frame.y = node.y + node.height + 20;
  }

  for (const color of colors) {
    const col = figma.createFrame();
    col.name = color.hex;
    col.layoutMode = 'VERTICAL';
    col.primaryAxisSizingMode = 'AUTO';
    col.counterAxisSizingMode = 'FIXED';
    col.resize(148, 100);
    col.itemSpacing = 6;
    col.paddingBottom = 10;
    col.counterAxisAlignItems = 'CENTER';
    col.fills = [];

    const rect = figma.createRectangle();
    rect.name = 'Color';
    rect.resize(148, 80);
    rect.fills = [{
      type: 'SOLID',
      color: { r: color.r / 255, g: color.g / 255, b: color.b / 255 }
    }];
    col.appendChild(rect);
    rect.layoutSizingHorizontal = 'FILL';
    rect.layoutSizingVertical = 'FIXED';

    const text = figma.createText();
    text.characters = color.hex;
    text.fontSize = 11;
    text.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
    col.appendChild(text);

    frame.appendChild(col);
  }

  figma.currentPage.appendChild(frame);
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);
  figma.notify('Swatches created!');
  figma.closePlugin();
}
