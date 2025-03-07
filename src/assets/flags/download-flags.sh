#!/bin/bash

# Create directory for flags if it doesn't exist
mkdir -p public/assets/flags

# Download flag images from a different source
# English (UK)
curl -o public/assets/flags/en.svg "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/gb.svg"

# Spanish
curl -o public/assets/flags/es.svg "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/es.svg"

# French
curl -o public/assets/flags/fr.svg "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/fr.svg"

# Italian
curl -o public/assets/flags/it.svg "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/it.svg"

# German
curl -o public/assets/flags/de.svg "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/de.svg"

# Polish
curl -o public/assets/flags/pl.svg "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/pl.svg"

# Russian
curl -o public/assets/flags/ru.svg "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/ru.svg"

# Ukrainian
curl -o public/assets/flags/uk.svg "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/ua.svg"

echo "Flag images downloaded successfully!" 