# Employee happiness project

Shows properly marked up Google Forms in a graph

## Adding new data

* Go to https://docs.google.com/forms/u/0/
* Open the form you want
* Click on the _responses_ tab
* In the upper richt corner of the tab, click on the three vertical dots
* Select "Download responses (.csv)
* Unzip de downloaded zip-file and move the .csv file to the folder _src/data_

Omzetten naar juiste format:

* open de file in Excel
* selecteer de eerste kolom
* Kies tab _Gegevens_ > _Tekst naar kolommen_
* Onder Kies het bestandstype... Selecteer _Gescheiden_ en klik _Volgende_
* Kies als scheidingstekens _Komma_, en klik _Voltooien_
* Kies _Bestand_ > _Opslaan als_ > _CSV UTF-8 (door komma's gescheiden) (*.csv)_
* Geef bestand naam *_Weekly happiness form X (Responses)* (X is weeknummer)