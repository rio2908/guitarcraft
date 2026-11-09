"""Generate the clean GuitarCraft launcher icons with pygame."""

from pathlib import Path
import pygame


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SIZE = 512
GREEN = (27, 100, 77)
GREEN_LIGHT = (222, 241, 230)
ORANGE = (225, 113, 61)
WHITE = (255, 255, 255)


def foreground():
    surface = pygame.Surface((SIZE, SIZE), pygame.SRCALPHA)
    pygame.draw.rect(surface, WHITE, (112, 104, 288, 304), border_radius=38)
    pygame.draw.rect(surface, GREEN_LIGHT, (112, 104, 288, 304), 8, border_radius=38)
    for fret in range(4):
        x = 132 + fret * 82
        pygame.draw.line(surface, GREEN if fret == 0 else (155, 182, 167),
                         (x, 129), (x, 383), 8 if fret == 0 else 4)
    for string in range(6):
        y = 153 + string * 43
        pygame.draw.line(surface, (142, 163, 151), (130, y), (380, y), 4)
    pygame.draw.circle(surface, ORANGE, (259, 239), 29)
    pygame.draw.circle(surface, WHITE, (259, 239), 12)
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
