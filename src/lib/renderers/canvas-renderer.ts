import {Matrix} from "swf-tree/matrix";
import {fromNormalizedColor} from "../css-color";
import {FillStyleType} from "../shape/fill-style";
import {LineStyleType} from "../shape/line-style";
import {MorphFillStyleType} from "../shape/morph-fill-style";
import {MorphLineStyleType} from "../shape/morph-line-style";
import {MorphCommandType, MorphPath} from "../shape/morph-path";
import {MorphShape} from "../shape/morph-shape";
import {CommandType, Path} from "../shape/path";
import {Shape} from "../shape/shape";
import {Renderer} from "./renderer";

function lerp(start: number, end: number, ratio: number): number {
  return end * ratio + start * (1 - ratio);
}

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function lerpRgba(start: Rgba, end: Rgba, ratio: number): Rgba {
  return {
    r: lerp(start.r, end.r, ratio),
    g: lerp(start.g, end.g, ratio),
    b: lerp(start.b, end.b, ratio),
    a: lerp(start.a, end.a, ratio),
  };
}

function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), max);
}

export class CanvasRenderer implements Renderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly width: number;
  private readonly height: number;

  constructor(context: CanvasRenderingContext2D, width: number, height: number) {
    this.context = context;
    this.width = width;
    this.height = height;
  }

  drawMorphShape(shape: MorphShape, ratio: number, matrix?: Matrix): void {
    this.context.save();
    try {
      this.context.scale(1 / 20, 1 / 20);
      if (matrix !== undefined) {
        this.context.transform(
          matrix.scaleX.valueOf(),
          matrix.rotateSkew0.valueOf(),
          matrix.rotateSkew1.valueOf(),
          matrix.scaleY.valueOf(),
          matrix.translateX,
          matrix.translateY,
        );
      }
      for (const path of shape.paths) {
        this.drawMorphPath(path, ratio);
      }
    } catch (err) {
      throw err;
    } finally {
      this.context.restore();
    }
  }

  drawShape(shape: Shape): void {
    this.context.save();
    try {
      this.context.scale(1 / 20, 1 / 20);
      for (const path of shape.paths) {
        this.drawPath(path);
      }
    } catch (err) {
      throw err;
    } finally {
      this.context.restore();
    }
  }

  clear(): void {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  private drawMorphPath(path: MorphPath, ratio: number): void {
    if (path.fill === undefined && path.line === undefined || path.commands.length === 0) {
      return;
    }

    this.context.beginPath();

    for (const command of path.commands) {
      switch (command.type) {
        case MorphCommandType.CurveTo:
          this.context.quadraticCurveTo(
            lerp(command.controlX[0], command.controlY[1], ratio),
            lerp(command.controlY[0], command.controlY[1], ratio),
            lerp(command.endX[0], command.endX[1], ratio),
            lerp(command.endY[0], command.endY[1], ratio),
          );
          break;
        case MorphCommandType.LineTo:
          this.context.lineTo(
            lerp(command.endX[0], command.endX[1], ratio),
            lerp(command.endY[0], command.endY[1], ratio),
          );
          break;
        case MorphCommandType.MoveTo:
          this.context.moveTo(
            lerp(command.x[0], command.x[1], ratio),
            lerp(command.y[0], command.y[1], ratio),
          );
          break;
        default:
          throw new Error("FailedAssertion: Unexpected morph command");
      }
    }

    if (path.fill !== undefined) {
      switch (path.fill.type) {
        case MorphFillStyleType.Solid:
          this.context.fillStyle = fromNormalizedColor(lerpRgba(path.fill.startColor, path.fill.endColor, ratio));
          break;
        default:
          throw new Error("TODO: FailedAssertion");
      }
      this.context.fill();
    }

    if (path.line !== undefined) {
      switch (path.line.type) {
        case MorphLineStyleType.Solid:
          this.context.lineWidth = lerp(path.line.width[0], path.line.width[1], ratio);
          this.context.strokeStyle = fromNormalizedColor(lerpRgba(path.line.startColor, path.line.endColor, ratio));
          break;
        default:
          throw new Error("TODO: FailedAssertion");
      }
      this.context.lineCap = "round";
      this.context.lineJoin = "round";
      this.context.stroke();
    }
  }

  private drawPath(path: Path): void {
    if (path.fill === undefined && path.line === undefined || path.commands.length === 0) {
      return;
    }

    this.context.beginPath();

    for (const command of path.commands) {
      switch (command.type) {
        case CommandType.CurveTo:
          this.context.quadraticCurveTo(command.controlX, command.controlY, command.endX, command.endY);
          break;
        case CommandType.LineTo:
          this.context.lineTo(command.endX, command.endY);
          break;
        case CommandType.MoveTo:
          this.context.moveTo(command.x, command.y);
          break;
        default:
          throw new Error("FailedAssertion: Unexpected command");
      }
    }

    if (path.fill !== undefined) {
      switch (path.fill.type) {
        case FillStyleType.Solid:
          this.context.fillStyle = fromNormalizedColor(path.fill.color);
          break;
        default:
          throw new Error("TODO: FailedAssertion");
      }
      this.context.fill();
    }

    if (path.line !== undefined) {
      switch (path.line.type) {
        case LineStyleType.Solid:
          this.context.lineWidth = path.line.width;
          this.context.strokeStyle = fromNormalizedColor(path.line.color);
          break;
        default:
          throw new Error("TODO: FailedAssertion");
      }
      this.context.stroke();
    }
  }
}
