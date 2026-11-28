# Thai text for a native-speaker check

Every Thai string on the site, next to its English one. Toon's native-speaker contact checks this list before Thai becomes the default at go-live (gate G3). Nothing here is final until that check is done.

**How to check:** read the Thai column. Change any Thai that sounds unnatural, too formal or wrong for Bangkok homebrewers. Write the fix next to it (a comment on the Trello card is fine). The builder copies the changes into the site.

**Where it lives:** the page text is in `docs/th/index.html` and `docs/th/calculator.html`. The text the calculator writes while you type is in `docs/js/i18n.js`. The beer style guides are in `docs/js/styles.js`. Change both the file and this list.

**Choices worth a second look:**
- *Volumes* (the unit for CO2) is written วอลุ่ม. Decided: Toon keeps วอลุ่ม rather than the English word (Sat 21 Nov).
- *Batch* is แบตช์ and *priming* is ไพรมิ่ง, as Thai homebrewers usually say them. OK?
- The tagline is translated: ต้มเบียร์และสร้างเครื่องมือเองในกรุงเทพฯ. Or should the Thai pages keep the English "Brewed and built in Bangkok" as a brand line?
- Home page copy (T16): the three venture names are Thai words, ระบบอัตโนมัติ, เมอร์ช and วันต้มเบียร์, not the English Automation, Merch and Brew days. All three are placeholders for now. Is เมอร์ช clear to Thai homebrewers, or is เสื้อ (shirt) better while the merch is only a T-shirt?
- Home page copy (T16): loanwords and new terms. *Dextrose dispenser* is เครื่องจ่ายเดกซ์โทรส. *Flocculation* stays in English letters, so readers see where "Floc" comes from (or ฟล็อกคูเลชัน?). แชร์ is used for "share". OK?
- Home page copy (T16): the tone is relaxed and spoken, as in แก้ยังไง, โผล่ and แวะมาดู. Right for the brand, or a little more formal (แก้อย่างไร)?
- Home page copy (T16): the T-shirt "isn't available yet" is ตอนนี้ยังไม่พร้อม, to avoid words about selling or ordering. Does it read naturally?
- Words in {curly brackets} are filled in by the page (a number, a style name or a sugar name). Keep them as they are.
- Error messages are listed by the field and problem they cover, e.g. (tempC.out-of-range).

## Home page (`docs/th/index.html`)

| English | ไทย (Thai) |
|---|---|
| Skip to content | ข้ามไปยังเนื้อหา |
| Floc Nation, home | Floc Nation หน้าแรก |
| Main | เมนูหลัก |
| Brewed and built in Bangkok | ต้มเบียร์และสร้างเครื่องมือเองในกรุงเทพฯ |
| Floc Nation · Brewed and built in Bangkok | Floc Nation · ต้มเบียร์และสร้างเครื่องมือเองในกรุงเทพฯ |
| Floc Nation brews beer at home in Bangkok and builds its own tools along the way. | Floc Nation ต้มเบียร์ที่บ้านในกรุงเทพฯ และสร้างเครื่องมือเองไปด้วย |
| Home | หน้าแรก |
| Priming calculator | คำนวณน้ำตาลไพรมิ่ง |

## Home page copy (T16, draft)

The approved home page text from `COPY.md`, with a Thai draft. It goes on `docs/th/index.html` when the home page is built, so it isn't on the site yet. Each row is one piece of text on the page: a heading, a bold name, a paragraph or the link. Bold is left out here, so the table shows the words only.

| English | ไทย (Thai) |
|---|---|
| Home brewing in Bangkok, and the tools that make it easier. | ต้มเบียร์เองในกรุงเทพฯ กับเครื่องมือที่ช่วยให้ต้มง่ายขึ้น |
| About Floc Nation | เกี่ยวกับ Floc Nation |
| Floc Nation brews beer at home in Bangkok and builds its own tools along the way. We share what goes wrong, why, and how it gets fixed. The name comes from flocculation: yeast clumping together and dropping out, so the beer clears. | Floc Nation ต้มเบียร์ที่บ้านในกรุงเทพฯ และสร้างเครื่องมือเองไปด้วย เราแชร์ปัญหาที่เจอ ว่าเกิดจากอะไร และแก้ยังไง ชื่อนี้มาจากคำว่า flocculation คือการที่ยีสต์จับตัวกันเป็นก้อนแล้วตกตะกอนลงก้นถัง เบียร์จึงใส |
| What we work on | สิ่งที่เราทำอยู่ |
| Automation. | ระบบอัตโนมัติ |
| Tools that take the slow, error-prone steps out of brewing. One is a dextrose dispenser, because measuring priming sugar by hand is fiddly. We're still building it. | เครื่องมือที่ทำแทนเราในขั้นตอนที่ช้าและพลาดง่ายตอนต้มเบียร์ หนึ่งในนั้นคือเครื่องจ่ายเดกซ์โทรส เพราะการตวงน้ำตาลไพรมิ่งด้วยมือเป็นงานจุกจิก ตัวนี้เรายังสร้างไม่เสร็จ |
| Merch. | เมอร์ช |
| A Floc Nation T-shirt for people who brew. It isn't available yet. | เสื้อยืด Floc Nation สำหรับคนต้มเบียร์ ตอนนี้ยังไม่พร้อม |
| Brew days. | วันต้มเบียร์ |
| A batch brewed from start to finish. This is where problems show up and fixes get tested. We share brew days online. They aren't open to visitors. | ต้มเบียร์หนึ่งแบตช์ตั้งแต่ต้นจนจบ เป็นวันที่ปัญหาโผล่ออกมา และได้ลองวิธีแก้ เราแชร์วันต้มเบียร์ทางออนไลน์ แต่ไม่ได้เปิดให้คนแวะมาดู |
| Priming-sugar calculator | คำนวณน้ำตาลไพรมิ่ง |
| Bottling soon? The priming-sugar calculator tells you how much sugar to add, for the whole batch and per bottle. | ถ้าใกล้จะบรรจุขวดแล้ว เครื่องคำนวณน้ำตาลไพรมิ่งจะบอกว่าต้องใส่น้ำตาลเท่าไร ทั้งแบตช์และต่อขวด |
| Open the calculator | เปิดเครื่องคำนวณ |
| Questions and fixes | คำถามและวิธีแก้ |
| Brewing at home, in Bangkok or anywhere else? Bring your questions and your fixes to any of the accounts below. | ถ้าคุณก็ต้มเบียร์เอง ไม่ว่าจะในกรุงเทพฯ หรือที่ไหนก็ตาม มาถามหรือแชร์วิธีแก้ของคุณได้ทุกช่องทางด้านล่าง |
| Follow along | ติดตามเรา |
| Floc Nation is flocnationbrew on: | Floc Nation ใช้ชื่อ flocnationbrew ในทุกช่องทาง |

## Calculator page (`docs/th/calculator.html`)

| English | ไทย (Thai) |
|---|---|
| Skip to content | ข้ามไปยังเนื้อหา |
| Floc Nation, home | Floc Nation หน้าแรก |
| Main | เมนูหลัก |
| Brewed and built in Bangkok | ต้มเบียร์และสร้างเครื่องมือเองในกรุงเทพฯ |
| Find us as flocnationbrew on | ติดตามเราในชื่อ flocnationbrew ได้ที่ |
| Priming-sugar calculator · Floc Nation | คำนวณน้ำตาลไพรมิ่ง · Floc Nation |
| Work out how much priming sugar to add at bottling, for the whole batch and for each bottle. | คำนวณว่าต้องใส่น้ำตาลไพรมิ่งเท่าไรตอนบรรจุขวด ทั้งสำหรับทั้งแบตช์และต่อขวด |
| Home | หน้าแรก |
| Priming calculator | คำนวณน้ำตาลไพรมิ่ง |
| Priming-sugar calculator | คำนวณน้ำตาลไพรมิ่ง |
| How much sugar to add at bottling, for the whole batch and for each bottle. | ต้องใส่น้ำตาลเท่าไรตอนบรรจุขวด ทั้งแบตช์และต่อขวด |
| Too little sugar gives flat beer. Too much gives gushers, or bottles that burst. The right amount depends on how much beer you have, how fizzy you want it and how warm it got after fermentation. | น้ำตาลน้อยไป เบียร์จะไม่ซ่า มากไป เบียร์จะพุ่งล้นตอนเปิด หรือขวดอาจระเบิด ปริมาณที่พอดีขึ้นอยู่กับว่ามีเบียร์เท่าไร อยากให้ซ่าแค่ไหน และหลังหมักเสร็จเบียร์เคยอุ่นขึ้นถึงกี่องศา |
| The calculator needs JavaScript. Turn it on to see the results. | เครื่องคำนวณนี้ต้องใช้ JavaScript เปิดใช้งานก่อนเพื่อดูผลลัพธ์ |
| Your beer | เบียร์ของคุณ |
| Beer volume in litres | ปริมาณเบียร์ เป็นลิตร |
| How much beer you are bottling. | ปริมาณเบียร์ที่จะบรรจุขวด |
| litres | ลิตร |
| Bottle size | ขนาดขวด |
| Custom bottle size in ml | ขนาดขวดที่กำหนดเอง เป็นมิลลิลิตร |
| ml | มล. |
| Beer style | สไตล์เบียร์ |
| Picking a style fills in its usual CO2 target. You can still change the target. | เลือกสไตล์แล้วจะได้ค่า CO2 เป้าหมายที่นิยมของสไตล์นั้น ยังแก้ค่าเป้าหมายเองได้ |
| Target CO2 in volumes | CO2 เป้าหมาย เป็นวอลุ่ม |
| Type the CO2 level you want, in volumes. | พิมพ์ระดับ CO2 ที่ต้องการ เป็นวอลุ่ม |
| volumes | วอลุ่ม |
| Highest temperature after fermentation in °C | อุณหภูมิสูงสุดหลังหมักเสร็จ เป็น °C |
| The warmest the beer has been since fermentation finished. It sets how much CO2 is still in the beer. | อุณหภูมิที่เบียร์อุ่นที่สุดตั้งแต่หมักเสร็จ ค่านี้บอกว่าในเบียร์ยังเหลือ CO2 อยู่เท่าไร |
| Sugar | น้ำตาล |
| Dextrose (corn sugar) | เดกซ์โทรส (น้ำตาลข้าวโพด) |
| Table sugar | น้ำตาลทราย |
| Sugar to add | น้ำตาลที่ต้องใส่ |
| Dextrose for the whole batch | เดกซ์โทรสสำหรับทั้งแบตช์ |
| Dextrose per 330 ml bottle | เดกซ์โทรสต่อขวด 330 มล. |
| Mixing the sugar into the whole batch before bottling? Use the batch figure. Adding it to each bottle? Use the per-bottle figure. | ถ้าผสมน้ำตาลลงในเบียร์ทั้งแบตช์ก่อนบรรจุ ให้ใช้ตัวเลขทั้งแบตช์ ถ้าใส่ทีละขวด ให้ใช้ตัวเลขต่อขวด |
| Beer keeps some CO2 after fermentation, and less of it the warmer it got. The calculator works out what is left, then the sugar needed to reach your target. | หลังหมักเสร็จ เบียร์ยังมี CO2 เหลืออยู่บ้าง ยิ่งเบียร์เคยอุ่นมากก็ยิ่งเหลือน้อย เครื่องคำนวณจะหาว่าเหลือเท่าไร แล้วคิดน้ำตาลที่ต้องใส่ให้ถึงเป้าหมาย |
| g (grams) | กรัม |

## Text the calculator writes while you type (`docs/js/i18n.js`)

| English | ไทย (Thai) |
|---|---|
| Use bottles rated for high pressure. | ใช้ขวดที่ทนแรงดันสูง |
| No sugar needed: the beer already holds this much CO2. | ไม่ต้องใส่น้ำตาล เบียร์มี CO2 ถึงระดับนี้อยู่แล้ว |
| Dextrose | เดกซ์โทรส |
| Table sugar | น้ำตาลทราย |
| Sugar | น้ำตาล |
| beer volume | ปริมาณเบียร์ |
| bottle size | ขนาดขวด |
| target CO2 | CO2 เป้าหมาย |
| highest temperature | อุณหภูมิสูงสุด |
| Fill in the {fields} to see how much sugar to add. | กรอก{fields} เพื่อดูว่าต้องใส่น้ำตาลเท่าไร |
| Fix the marked fields to see the result. | แก้ช่องที่ทำเครื่องหมายไว้ เพื่อดูผลลัพธ์ |
| ,  |   |
|  and  |  และ |
| {sugar} for the whole batch | {sugar}สำหรับทั้งแบตช์ |
| {sugar} per {ml} ml bottle | {sugar}ต่อขวด {ml} มล. |
| The beer already holds about {vols} volumes of CO2. | เบียร์มี CO2 อยู่แล้วประมาณ {vols} วอลุ่ม |
| Type the CO2 level you want, in volumes. | พิมพ์ระดับ CO2 ที่ต้องการ เป็นวอลุ่ม |
| {style}: usually {range}. | {style}: ปกติ {range} |
| Your target is outside this range. | ค่าเป้าหมายของคุณอยู่นอกช่วงนี้ |
| {min} to {max} volumes | {min} ถึง {max} วอลุ่ม |
| Usual range | ช่วงที่นิยม |
| {range}. | {range} |
| Typical beers | เบียร์ทั่วไป |
| Most styles sit between {min} and {max} volumes. {high} goes up to {highMax}. | เบียร์ส่วนใหญ่อยู่ระหว่าง {min} ถึง {max} วอลุ่ม {high}ขึ้นไปได้ถึง {highMax} |
| {ml} ml | {ml} มล. |
| Custom size | กำหนดขนาดเอง |
| British ales | เอลสไตล์อังกฤษ |
| Stout and porter | สเตาต์และพอร์เตอร์ |
| American ales and IPA | เอลอเมริกันและ IPA |
| Lager and pilsner | ลาเกอร์และพิลส์เนอร์ |
| Wheat beer | เบียร์ข้าวสาลี |
| Custom | กำหนดเอง |
| (litres.empty) | ใส่ปริมาณเบียร์เป็นลิตร |
| (litres.not-number) | ปริมาณเบียร์ต้องเป็นตัวเลข |
| (litres.not-positive) | ปริมาณเบียร์ต้องมากกว่า 0 ลิตร |
| (tempC.empty) | ใส่อุณหภูมิสูงสุดที่เบียร์เคยขึ้นถึง |
| (tempC.not-number) | อุณหภูมิต้องเป็นตัวเลข |
| (tempC.out-of-range) | อุณหภูมิต้องอยู่ระหว่าง {min} ถึง {max} °C |
| (targetVols.empty) | ใส่ระดับ CO2 ที่ต้องการ เป็นวอลุ่ม |
| (targetVols.not-number) | CO2 เป้าหมายต้องเป็นตัวเลข |
| (targetVols.not-positive) | CO2 เป้าหมายต้องมากกว่า 0 วอลุ่ม |
| (bottleMl.empty) | ใส่ขนาดขวดเป็นมิลลิลิตร |
| (bottleMl.not-number) | ขนาดขวดต้องเป็นตัวเลข |
| (bottleMl.not-positive) | ขนาดขวดต้องมากกว่า 0 มล. |
| (bottleMl.too-big) | ขนาดขวดต้องไม่ใหญ่กว่าปริมาณเบียร์ทั้งหมด |
| (sugar.unknown) | เลือกเดกซ์โทรสหรือน้ำตาลทราย |
| (any other input problem) | ค่านี้ใช้ไม่ได้ ลองตรวจดูอีกครั้ง |

## Beer style guides (`docs/js/styles.js`)

| English | ไทย (Thai) |
|---|---|
| Low and soft. Fresh, not fizzy, so the malt and hops come first. | ซ่าน้อยและนุ่ม สดชื่นแต่ไม่ฟู่ ให้รสมอลต์และฮอปส์เด่นกว่า |
| Serving | การเสิร์ฟ |
| Cool, not cold. About 11 to 13 °C, warmer than a lager. | เย็นแต่ไม่เย็นจัด ประมาณ 11 ถึง 13 °C อุ่นกว่าลาเกอร์ |
| Bottles | ขวด |
| Standard bottles are fine. This style stays under 3.0 volumes. | ใช้ขวดธรรมดาได้ สไตล์นี้ไม่เกิน 3.0 วอลุ่ม |
| Low or high end | ค่าต่ำหรือค่าสูง |
| Go low for a soft, cask-like pint. Go high for a firmer head that lasts. | ค่าต่ำได้เบียร์นุ่มแบบเบียร์ถัง ค่าสูงได้หัวฟองแน่นที่อยู่ได้นาน |
| Moderate and smooth. Enough to hold a head, but low enough to keep the body creamy. | ซ่าปานกลางและนุ่มนวล พอให้มีหัวฟอง แต่ไม่มากจนเสียเนื้อสัมผัสครีมมี่ |
| Cool, about 10 to 13 °C. Too cold hides the roast flavours. | เย็นพอประมาณ ราว 10 ถึง 13 °C ถ้าเย็นเกินไปจะกลบรสคั่ว |
| Go low for a rich, full-bodied stout. Go high for a lighter, drier porter. | ค่าต่ำเหมาะกับสเตาต์ที่เข้มข้นและบอดี้หนา ค่าสูงเหมาะกับพอร์เตอร์ที่เบาและแห้งกว่า |
| Medium and lively. The bubbles carry the hop aroma and keep the finish crisp. | ซ่าปานกลางและสดชื่น ฟองช่วยพากลิ่นฮอปส์ขึ้นมาและทำให้จบสะอาด |
| Cold, but not ice cold. About 7 to 10 °C. | เย็นแต่ไม่ถึงกับเย็นจัด ประมาณ 7 ถึง 10 °C |
| Go low for a malty amber or a strong ale. Go high for a dry, hoppy IPA. | ค่าต่ำเหมาะกับแอมเบอร์ที่เน้นมอลต์หรือสตรองเอล ค่าสูงเหมาะกับ IPA ที่แห้งและเน้นฮอปส์ |
| Crisp and lively, with fine bubbles and a firm head. A clean, light beer tastes dull without it. | ซ่าสดชื่น ฟองละเอียด หัวฟองแน่น เบียร์ใสเบาๆ ถ้าซ่าไม่พอจะรสจืด |
| Cold, about 4 to 7 °C. | เย็น ประมาณ 4 ถึง 7 °C |
| The range is narrow. Go low for a darker, maltier lager. Go high for a pale, dry pilsner. | ช่วงนี้แคบ ค่าต่ำเหมาะกับลาเกอร์สีเข้มที่เน้นมอลต์ ค่าสูงเหมาะกับพิลส์เนอร์สีอ่อนที่แห้ง |
| High and lively. A tall, thick head carries the yeast aroma. | ซ่ามากและสดชื่น หัวฟองสูงหนาช่วยพากลิ่นยีสต์ |
| Cold, in a tall glass with room for the foam. | เย็น ในแก้วทรงสูงที่มีที่ว่างให้ฟอง |
| Standard bottles are fine only up to about 3.0 volumes. Use bottles rated for high pressure. | ขวดธรรมดารับได้แค่ราว 3.0 วอลุ่ม ให้ใช้ขวดที่ทนแรงดันสูง |
| The default sits near the low end, a safe start. Go higher for more foam, only in bottles rated for it. | ค่าเริ่มต้นอยู่ใกล้ปลายต่ำ เริ่มตรงนี้ปลอดภัย อยากได้ฟองมากขึ้นค่อยเพิ่ม และต้องใช้ขวดที่ทนแรงดันได้เท่านั้น |
| Where to start | เริ่มจากตรงไหน |
| Start from the closest style and adjust its target a little. | เริ่มจากสไตล์ที่ใกล้เคียงที่สุด แล้วปรับค่าเป้าหมายทีละนิด |
| In the glass | ในแก้ว |
| Lower feels softer. Higher feels crisper, with a bigger head. | ค่าต่ำจะนุ่มกว่า ค่าสูงจะซ่าสดชื่นกว่าและหัวฟองใหญ่กว่า |
| Standard bottles are fine up to about 3.0 volumes. Above that, use bottles rated for high pressure. | ขวดธรรมดาใช้ได้ถึงราว 3.0 วอลุ่ม ถ้าสูงกว่านั้นให้ใช้ขวดที่ทนแรงดันสูง |
