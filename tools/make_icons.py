"""Generate GuitarCraft launcher icons with pygame."""

from pathlib import Path
import pygame


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SIZE = 512
GREEN = (72, 132, 61)
GREEN_LIGHT = (139, 185, 91)
DIRT = (106, 75, 43)
ORANGE = (234, 166, 64)
WHITE = (248, 245, 222)


def foreground():
    surface = pygame.Surface((SIZE, SIZE), pygame.SRCALPHA)
    pygame.draw.rect(surface, DIRT, (124, 105, 264, 302))
    pygame.draw.rect(surface, (49, 55, 42), (124, 105, 264, 302), 12)
    for fret in range(4):
        x = 137 + fret * 80
        pygame.draw.rect(surface, WHITE, (x, 118, 12 if fret == 0 else 6, 274))
    for string in range(6):
        y = 139 + string * 46
        pygame.draw.rect(surface, WHITE, (132, y, 248, 4 + string // 2))
    pygame.draw.rect(surface, (49, 55, 42), (226, 203, 62, 62))
    pygame.draw.rect(surface, ORANGE, (233, 210, 48, 48))
    pygame.draw.rect(surface, WHITE, (239, 216, 13, 7))
    return surface


def main():
    pygame.init()
    ASSETS.mkdir(exist_ok=True)
    face = foreground()
    background = pygame.Surface((SIZE, SIZE), pygame.SRCALPHA)
    background.fill(GREEN)
    for x in range(0, SIZE, 64):
        for y in range(0, SIZE, 64):
            if (x // 64 + 3 * y // 64) % 4 == 0:
                pygame.draw.rect(background, GREEN_LIGHT, (x, y, 32, 32))
    pygame.image.save(background, str(ASSETS / "icon-background.png"))
    pygame.image.save(face, str(ASSETS / "icon-foreground.png"))
    icon = background.copy()
    icon.blit(face, (0, 0))
    pygame.image.save(icon, str(ASSETS / "icon.png"))
    pygame.quit()


if __name__ == "__main__":
    main()
