
#include "HX711.h"

#define HX711_DT D6
#define HX711_SCK D5
#define BUZZER D7
#define LED D2

HX711 scale;

long baseline = 0;
long threshold = 12000;

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER, OUTPUT);
  pinMode(LED, OUTPUT);

  digitalWrite(BUZZER, LOW);
  digitalWrite(LED, LOW);

  scale.begin(HX711_DT, HX711_SCK);

  Serial.println("Smart Medicine Bottle");

  while (!scale.is_ready()) {
    delay(100);
  }

  delay(2000);
  baseline = scale.read_average(10);

  Serial.println("System Ready");
}

void loop() {
  if (!scale.is_ready()) {
    digitalWrite(BUZZER, LOW);
    digitalWrite(LED, LOW);
    Serial.println("HX711 not ready");
    delay(500);
    return;
  }

  long current = scale.read_average(5);
  long difference = abs(current - baseline);

  Serial.print("Raw: ");
  Serial.print(current);
  Serial.print(" | Change: ");
  Serial.println(difference);

  if (difference > threshold) {
    digitalWrite(BUZZER, HIGH);
    digitalWrite(LED, HIGH);
  } else {
    digitalWrite(BUZZER, LOW);
    digitalWrite(LED, LOW);
  }

  delay(500);
}
