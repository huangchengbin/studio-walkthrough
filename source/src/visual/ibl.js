// Procedural indoor studio environment baked to a PMREM texture.
// A warm ceiling softbox, neutral walls, a cool window side and a few bright
// light-strip cards give PBR materials believable ambient light and reflections
// without shipping an HDR file.
import { BoxGeometry, Color, Mesh, MeshBasicMaterial, PMREMGenerator, Scene } from "three";

export function createStudioEnvironment(renderer) {
  const env = new Scene();
  const box = new BoxGeometry(26, 9, 18);
  const mat = (r, g, b) =>
    new MeshBasicMaterial({ color: new Color(r, g, b), side: 1 /* BackSide */ });
  // BoxGeometry group order: +x, -x, +y, -y, +z, -z.
  const ceiling = mat(3.1, 2.85, 2.45); // warm softbox
  const floor = mat(0.16, 0.15, 0.14); // dark warm bounce
  const wallWarm = mat(0.52, 0.55, 0.53);
  const wallCool = mat(0.62, 0.74, 0.9); // window side
  const shell = new Mesh(box, [wallWarm, wallWarm, ceiling, floor, wallCool, wallWarm]);
  shell.material.forEach((m) => (m.side = 1));
  env.add(shell);

  // Bright ceiling light cards → crisp highlight streaks on glossy surfaces.
  const cardGeo = new BoxGeometry(3.4, 0.06, 0.9);
  const cardMat = new MeshBasicMaterial({ color: new Color(5.2, 4.8, 4.1) });
  const cards = [
    [0, 4.35, -3.5],
    [4.2, 4.35, -3.5],
    [0, 4.35, 0.5],
    [4.2, 4.35, 0.5],
    [9.4, 4.35, -2.2],
    [9.4, 4.35, -3.6],
  ];
  for (const [x, y, z] of cards) {
    const card = new Mesh(cardGeo, cardMat);
    card.position.set(x, y, z);
    env.add(card);
  }
  // A cool window rectangle on the -z wall (photo wall side).
  const windowMat = new MeshBasicMaterial({ color: new Color(2.6, 3.1, 3.9) });
  const windowCard = new Mesh(new BoxGeometry(6.5, 2.6, 0.05), windowMat);
  windowCard.position.set(3.4, 1.9, -8.9);
  env.add(windowCard);

  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(env, 0.04);
  pmrem.dispose();
  target.texture.name = "Studio IBL";
  return target.texture;
}
