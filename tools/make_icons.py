"""Generate GuitarCraft launcher icons with pygame."""

from pathlib import Path
import pygame


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SIZE = 512
GREEN = (28, 80, 61)
ORANGE = (237, 121, 75)
WHITE = (255, 255, 255)


def foreground():
    surface = pygame.Surface((SIZE, SIZE), pygame.SRCALPHA)
    for fret in range(4):
        x = 137 + fret * 80
        pygame.draw.line(surface, WHITE, (x, 107), (x, 404), 14 if fret == 0 else 6)
    for string in range(6):
        y = 139 + string * 46
        pygame.draw.line(surface, WHITE, (132, y), (380, y), 3 + string // 2)
    pygame.draw.circle(surface, ORANGE, (257, 231), 29)
    return surface


def main():
    pygame.init()
    ASSETS.mkdir(exist_ok=True)
    face = foreground()
    background = pygame.Surface((SIZE, SIZE), pygame.SRCALPHA)
    background.fill(GREEN)
    pygame.image.save(background, str(ASSETS / "icon-background.png"))
    pygame.image.save(face, str(ASSETS / "icon-foreground.png"))
    icon = background.copy()
    icon.blit(face, (0, 0))
    pygame.image.save(icon, str(ASSETS / "icon.png"))
    pygame.quit()


if __name__ == "__main__":
    main()
