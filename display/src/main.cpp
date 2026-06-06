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

float tokenPercent = 0.0;
char pokemonName[16] = "PIKACHU";
char spirit[16] = "";
int resetsMinutes = -1;
unsigned long lastBlink = 0;
bool blinkState = true;

String serialBuffer = "";

void drawFrame() {
  // Solo borde derecho y borde inferior — sin flecha
  u8g2.drawVLine(127, 0, 64);
  u8g2.drawHLine(38, 63, 90);
  u8g2.drawVLine(38, 0, 64);
}

void drawHPBar(float percentUsed) {
  float hp = 100.0 - percentUsed;

  // "PS:" en su propia línea
  u8g2.setFont(u8g2_font_5x7_tr);
  u8g2.drawStr(42, 30, "PS:");

  // Barra en la línea siguiente, con más espacio
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

  // PS label + barra
  drawHPBar(percentUsed);

  // Tiempo hasta reset
  u8g2.setFont(u8g2_font_5x7_tr);
  if (resetsMinutes >= 0) {
    if (resetsMinutes >= 60) {
      snprintf(buf, sizeof(buf), "~%dh%02dm", resetsMinutes / 60, resetsMinutes % 60);
    } else {
      snprintf(buf, sizeof(buf), "~%dm", resetsMinutes);
    }
    u8g2.drawStr(42, 49, buf);
  }

  // Número alineado a la derecha
  snprintf(buf, sizeof(buf), "%.0f /100", hp);
  int textX = 122 - (strlen(buf) * 5);
  u8g2.drawStr(textX, 56, buf);
}

void setup() {
  Wire.begin(21, 22);
  u8g2.begin();
  Serial.begin(115200);
}

void loop() {
  if (millis() - lastBlink > 400) {
    blinkState = !blinkState;
    lastBlink = millis();
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

  u8g2.drawXBM(0, 16, 32, 32, epd_bitmap_pikachu);
  drawFrame();
  drawStats(tokenPercent);

  u8g2.sendBuffer();
}
