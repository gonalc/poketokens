#include <Arduino.h>
#include <U8g2lib.h>
#include <Wire.h>

U8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE);

const unsigned char epd_bitmap_pikachu [] PROGMEM = {
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
  0x80, 0x03, 0xd0, 0x00, 0x80, 0xff, 0x7f, 0x00, 0x00, 0xfe, 0x7f, 0x00, 0x00, 0xfe, 0x0f, 0x00,
  0x00, 0xf2, 0x0d, 0x00, 0x00, 0xf2, 0x19, 0x04, 0x00, 0xdf, 0x1f, 0x06, 0x00, 0xff, 0x1f, 0x07,
  0x00, 0xef, 0x9f, 0x07, 0x00, 0xff, 0xdf, 0x07, 0x00, 0xff, 0xdf, 0x03, 0x00, 0xfe, 0x9f, 0x03,
  0x00, 0xfd, 0x9f, 0x03, 0x00, 0x6f, 0xdf, 0x01, 0x00, 0xfb, 0xdd, 0x00, 0x00, 0xff, 0x5f, 0x00,
  0x00, 0xff, 0x1f, 0x00, 0x00, 0xfe, 0x1f, 0x00, 0x00, 0xfc, 0x0f, 0x00, 0x00, 0x08, 0x00, 0x00
};

const unsigned char epd_bitmap_charizard [] PROGMEM = {
  0x00, 0x00, 0x00, 0x00, 0x00, 0x3c, 0x00, 0x00, 0xa0, 0xd3, 0x20, 0x00, 0xf0, 0xc3, 0x42, 0x00,
  0x00, 0xff, 0x80, 0x01, 0x00, 0xfc, 0x80, 0x02, 0x00, 0x66, 0x80, 0x04, 0x40, 0x18, 0x00, 0x04,
  0x00, 0x00, 0x40, 0x08, 0x00, 0x00, 0x40, 0x08, 0x00, 0x10, 0x20, 0x10, 0x00, 0x1c, 0x20, 0x30,
  0x00, 0x0e, 0x1a, 0x31, 0x00, 0x1f, 0xc8, 0x31, 0x80, 0x1f, 0xc0, 0x23, 0x58, 0x3c, 0xe0, 0x67,
  0x40, 0x7b, 0xe0, 0x67, 0x0e, 0xca, 0xe0, 0x67, 0x62, 0xe7, 0xe0, 0x67, 0x20, 0xf0, 0xc0, 0x62,
  0xf8, 0x00, 0x00, 0x62, 0x78, 0x1b, 0x00, 0x26, 0xf8, 0xfd, 0x00, 0x26, 0xf8, 0xff, 0x01, 0x37,
  0xf2, 0xfe, 0x81, 0x06, 0xf6, 0xce, 0x41, 0x02, 0xe6, 0x75, 0xa0, 0x03, 0x84, 0x11, 0x80, 0x01,
  0x00, 0x18, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2a, 0x6c, 0x03, 0x00, 0x00, 0x04, 0x00, 0x00
};

const unsigned char epd_bitmap_gengar [] PROGMEM = {
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x02, 0x00, 0x00, 0x00, 0x03, 0x00,
  0x00, 0x00, 0x08, 0x00, 0x00, 0x01, 0x0c, 0x00, 0x00, 0xea, 0x05, 0x00, 0x00, 0xfa, 0x01, 0x00,
  0x00, 0xfc, 0x01, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
};

struct PokemonSprite {
  const char* name;
  const unsigned char* bitmap;
};

const PokemonSprite sprites[] = {
  { "PIKACHU",   epd_bitmap_pikachu },
  { "CHARIZARD", epd_bitmap_charizard },
  { "GENGAR",    epd_bitmap_gengar },
};
const int spritesCount = sizeof(sprites) / sizeof(sprites[0]);

const unsigned char* getSpriteForPokemon(const char* name) {
  for (int i = 0; i < spritesCount; i++) {
    if (strcasecmp(sprites[i].name, name) == 0) return sprites[i].bitmap;
  }
  return epd_bitmap_pikachu;
}

#define BUTTON_PIN 4

float tokenPercent = 0.0;
char pokemonName[16] = "PIKACHU";
char spirit[16] = "";
int resetsMinutes = -1;
unsigned long lastBlink = 0;
bool blinkState = true;

bool buttonAvailable = false;
bool lastButtonReading = HIGH;
bool stableButtonState = HIGH;
unsigned long lastDebounce = 0;
const unsigned long debounceDelay = 50;

String serialBuffer = "";

void drawFrame() {
  // Right border and bottom border only — no arrow
  u8g2.drawVLine(127, 0, 64);
  u8g2.drawHLine(38, 63, 90);
  u8g2.drawVLine(38, 0, 64);
}

void drawHPBar(float percentUsed) {
  float hp = 100.0 - percentUsed;

  // "PS:" on its own line
  u8g2.setFont(u8g2_font_5x7_tr);
  u8g2.drawStr(42, 30, "PS:");

  // Bar on the next line, with extra padding
  int barX = 42;
  int barY = 33;
  int barW = 80;
  int barH = 6;

  u8g2.drawFrame(barX, barY, barW, barH);

  int fillW = (int)((barW - 2) * hp / 100.0);
  if (fillW < 0) fillW = 0;

  if (fillW > 0) {
    if (hp > 50) {
      u8g2.drawBox(barX + 1, barY + 1, fillW, barH - 2);
    } else if (hp > 20) {
      for (int x = barX + 1; x < barX + 1 + fillW; x++) {
        for (int y = barY + 1; y < barY + barH - 1; y++) {
          if ((x + y) % 2 == 0) u8g2.drawPixel(x, y);
        }
      }
    } else {
      if (blinkState) {
        for (int x = barX + 1; x < barX + 1 + fillW; x++) {
          for (int y = barY + 1; y < barY + barH - 1; y++) {
            if ((x + y) % 3 == 0) u8g2.drawPixel(x, y);
          }
        }
      }
    }
  }
}

void parseSerialLine(const String& line) {
  int start = 0;
  while (start < (int)line.length()) {
    int comma = line.indexOf(',', start);
    String token = (comma == -1) ? line.substring(start) : line.substring(start, comma);
    start = (comma == -1) ? line.length() : comma + 1;

    int eq = token.indexOf('=');
    if (eq == -1) continue;
    String key = token.substring(0, eq);
    String val = token.substring(eq + 1);
    key.trim(); val.trim();

    if (key == "tokens") {
      tokenPercent = val.toFloat();
    } else if (key == "resets") {
      resetsMinutes = val.toInt();
    } else if (key == "pokemon") {
      val.toCharArray(pokemonName, sizeof(pokemonName));
    } else if (key == "spirit") {
      val.toCharArray(spirit, sizeof(spirit));
    }
  }
}

void drawStats(float percentUsed) {
  float hp = 100.0 - percentUsed;
  char buf[20];

  u8g2.setFont(u8g2_font_6x10_tr);
  u8g2.drawStr(42, 18, pokemonName);

  // PS label + bar
  drawHPBar(percentUsed);

  // Time until reset
  u8g2.setFont(u8g2_font_5x7_tr);
  if (resetsMinutes >= 0) {
    if (resetsMinutes >= 60) {
      snprintf(buf, sizeof(buf), "~%dh%02dm", resetsMinutes / 60, resetsMinutes % 60);
    } else {
      snprintf(buf, sizeof(buf), "~%dm", resetsMinutes);
    }
    u8g2.drawStr(42, 49, buf);
  }

  // Right-aligned number
  snprintf(buf, sizeof(buf), "%.0f /100", hp);
  int textX = 122 - (strlen(buf) * 5);
  u8g2.drawStr(textX, 56, buf);
}

void setup() {
  Wire.begin(21, 22);
  u8g2.begin();
  Serial.begin(115200);
  randomSeed(esp_random());

  // GPIO 0-39 are valid on ESP32; 6-11 are reserved for flash
  if (BUTTON_PIN >= 0 && BUTTON_PIN <= 39 && !(BUTTON_PIN >= 6 && BUTTON_PIN <= 11)) {
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    buttonAvailable = true;
    Serial.printf("[button] found on pin %d\n", BUTTON_PIN);
  } else {
    Serial.printf("[button] NOT available (pin %d is invalid or reserved)\n", BUTTON_PIN);
  }
}

void loop() {
  if (millis() - lastBlink > 400) {
    blinkState = !blinkState;
    lastBlink = millis();
  }

  if (buttonAvailable) {
    bool reading = digitalRead(BUTTON_PIN);
    if (reading != lastButtonReading) {
      lastDebounce = millis();
      lastButtonReading = reading;
    }
    if ((millis() - lastDebounce) > debounceDelay && reading != stableButtonState) {
      stableButtonState = reading;
      if (stableButtonState == LOW) {
        int idx;
        do { idx = random(spritesCount); } while (spritesCount > 1 && strcmp(sprites[idx].name, pokemonName) == 0);
        strncpy(pokemonName, sprites[idx].name, sizeof(pokemonName) - 1);
        pokemonName[sizeof(pokemonName) - 1] = '\0';
        Serial.printf("[button] pressed → switching to %s\n", pokemonName);
      }
    }
  }

  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      serialBuffer.trim();
      if (serialBuffer.length() > 0) parseSerialLine(serialBuffer);
      serialBuffer = "";
    } else {
      serialBuffer += c;
    }
  }

  u8g2.clearBuffer();

  u8g2.drawXBM(0, 16, 32, 32, getSpriteForPokemon(pokemonName));
  drawFrame();
  drawStats(tokenPercent);

  u8g2.sendBuffer();
}
