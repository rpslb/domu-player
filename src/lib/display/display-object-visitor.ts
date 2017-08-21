import { SwfLoader } from "./loader";
import { MorphShape } from "./morph-shape";
import { Shape } from "./shape";
import { Sprite } from "./sprite";
import { Stage } from "./stage";

export interface DisplayObjectVisitor<R = void> {
  visitStage(stage: Stage): R;

  visitLoader(loader: SwfLoader): R;

  visitSprite(sprite: Sprite): R;

  visitShape(shape: Shape): R;

  visitMorphShape(morphShape: MorphShape): R;
}
