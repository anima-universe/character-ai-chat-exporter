# Store listing

Everything the Chrome Web Store, Firefox Add-ons and Microsoft Edge Add-ons forms ask for. The name and short description in
each language come from `_locales/` by themselves.

- **Category:** Chrome — Tools. Firefox — Download Management and Social & Communication, Firefox for desktop only (Android
  is not tested). Edge — Productivity.
- **Website:** https://amavie.ai/character-ai-export. Chrome **Official URL:** amavie.ai (verified in Search Console).
- **Support:** support@amavie.ai; Chrome asks for a URL — https://amavie.ai/help.
- **Privacy policy:** https://github.com/anima-universe/character-ai-chat-exporter/blob/main/PRIVACY.md (Firefox takes the
  text of `PRIVACY.md` instead of a link).
- **Pictures:** 1280×800 screenshots and a 440×280 tile from `store/make-assets.mjs`. Firefox does not take the icon from the
  package: upload `icons/icon128.png` as the custom icon. Screenshot captions: “One button on your Character.AI tab: Save my
  chats” · “It reads every chat. Stop any time and keep what is done” · “One file in Downloads, plus plain text if you want it”.

## Privacy tab

- **Single purpose:** Saves the user's own Character.AI chats, characters and personas to a file on the user's device.
- **activeTab:** Lets the extension run on the Character.AI tab only after the user presses its toolbar button there.
- **scripting:** Runs the exporter and its panel in that tab when the user presses the button.
- **Remote code:** No. Everything that runs is in the package.
- **Data usage:** The extension collects nothing. Tick none of the data types. Certify: not sold, not used for anything
  unrelated, not used for credit decisions.
- **Firefox data collection:** none.

## Notes for the reviewer

Sign in to character.ai with any account that has a chat, press the toolbar button, then press "Save my chats". A JSON file
downloads. No account of ours is needed. The source is at https://github.com/anima-universe/character-ai-chat-exporter, and
nothing is bundled or minified.

## Long description

### en

Save your own Character.AI chats to a file on your computer, in minutes. The official export can take 3 to 4 weeks, and its download link expires after 7 days.

What you get:
• Every chat, oldest first, with who wrote each line and when
• The replies you could have swiped to
• Your own characters with their definitions, and the details of the ones you talked to
• Your personas and memory boxes
• One JSON file, and plain text if you want it

How it works:
1. Sign in to Character.AI
2. Press the extension's button
3. Press "Save my chats" and leave the tab open

Stop any time: every chat read so far is saved. Open the file in the free viewer on amavie.ai, which reads it in your browser.

Private by design: it asks for no access in advance and runs only on the tab where you press the button. It only reads, it talks only to Character.AI with your own session, and it has no analytics and no servers. Open source under the MIT license.

Made by Amavie. Not affiliated with, endorsed by or sponsored by Character Technologies, Inc. Character.AI is a trademark of its owner.

### ru

Сохраните свои чаты из Character.AI в файл на компьютере за считаные минуты. Официальная выгрузка может идти 3–4 недели, а ссылка на скачивание живёт 7 дней.

Что вы получите:
• Все чаты по порядку, с автором и временем каждой реплики
• Варианты ответов, которые можно было пролистать
• Своих персонажей с определениями и данные тех, с кем вы говорили
• Образы и блоки памяти
• Один файл JSON и, если нужно, обычный текст

Как это работает:
1. Войдите в Character.AI
2. Нажмите кнопку расширения
3. Нажмите «Сохранить мои чаты» и не закрывайте вкладку

Остановить можно в любой момент: всё прочитанное сохранится. Файл открывается в бесплатном просмотрщике на amavie.ai прямо в браузере.

Расширение не просит доступа заранее и работает только на вкладке, где вы нажали кнопку. Оно только читает, обращается только к Character.AI от вашего имени, без аналитики и своих серверов. Открытый код, лицензия MIT.

Сделано в Amavie. Не связано с Character Technologies, Inc. Character.AI — товарный знак его владельца.

### es

Guarda tus chats de Character.AI en un archivo en tu ordenador, en minutos. La exportación oficial puede tardar de 3 a 4 semanas, y el enlace de descarga caduca a los 7 días.

Qué obtienes:
• Todos los chats en orden, con quién escribió cada línea y cuándo
• Las respuestas alternativas
• Tus personajes con sus definiciones y los datos de aquellos con quienes hablaste
• Tus personas y cuadros de memoria
• Un archivo JSON y, si quieres, texto plano

Cómo funciona:
1. Inicia sesión en Character.AI
2. Pulsa el botón de la extensión
3. Pulsa «Guardar mis chats» y deja la pestaña abierta

Puedes parar cuando quieras: lo leído se guarda. Abre el archivo en el visor gratuito de amavie.ai, que lo lee en tu navegador.

No pide acceso por adelantado y solo funciona en la pestaña donde pulsas el botón. Solo lee, solo habla con Character.AI con tu sesión, sin analíticas ni servidores propios. Código abierto, licencia MIT.

Hecho por Amavie. Sin relación con Character Technologies, Inc. Character.AI es una marca de su propietario.

### pt_BR

Salve suas conversas do Character.AI em um arquivo no computador, em minutos. A exportação oficial pode levar de 3 a 4 semanas, e o link de download expira em 7 dias.

O que você recebe:
• Todas as conversas em ordem, com quem escreveu cada fala e quando
• As respostas alternativas
• Seus personagens com as definições e os dados daqueles com quem você falou
• Suas personas e caixas de memória
• Um arquivo JSON e, se quiser, texto puro

Como funciona:
1. Entre no Character.AI
2. Aperte o botão da extensão
3. Aperte “Salvar minhas conversas” e deixe a aba aberta

Dá para parar quando quiser: o que já foi lido fica salvo. Abra o arquivo no visualizador grátis do amavie.ai, que lê tudo no seu navegador.

Não pede acesso antecipado e só funciona na aba em que você aperta o botão. Só lê, só fala com o Character.AI com a sua sessão, sem análises nem servidores próprios. Código aberto, licença MIT.

Feito pelo Amavie. Sem ligação com a Character Technologies, Inc. Character.AI é uma marca do seu dono.

### de

Speichere deine Chats von Character.AI in Minuten in einer Datei auf deinem Computer. Der offizielle Export kann 3 bis 4 Wochen dauern, und der Download-Link läuft nach 7 Tagen ab.

Das bekommst du:
• Alle Chats der Reihe nach, mit Autor und Zeit jeder Zeile
• Die alternativen Antworten
• Deine Charaktere mit Definition und die Angaben zu denen, mit denen du gesprochen hast
• Deine Personas und Memory-Boxen
• Eine JSON-Datei und auf Wunsch reinen Text

So geht’s:
1. Bei Character.AI anmelden
2. Den Knopf der Erweiterung drücken
3. „Meine Chats speichern“ drücken und den Tab offen lassen

Du kannst jederzeit anhalten: Alles Gelesene wird gespeichert. Öffne die Datei im kostenlosen Viewer auf amavie.ai, der sie in deinem Browser liest.

Die Erweiterung fragt vorab keinen Zugriff an und läuft nur in dem Tab, in dem du den Knopf drückst. Sie liest nur, spricht nur mit Character.AI über deine Sitzung, ohne Analyse und ohne eigene Server. Offener Code, MIT-Lizenz.

Von Amavie. Nicht mit Character Technologies, Inc. verbunden. Character.AI ist eine Marke ihres Inhabers.

### fr

Enregistrez vos chats Character.AI dans un fichier sur votre ordinateur, en quelques minutes. L’export officiel peut prendre 3 à 4 semaines, et le lien de téléchargement expire au bout de 7 jours.

Ce que vous obtenez :
• Tous les chats dans l’ordre, avec l’auteur et l’heure de chaque réplique
• Les réponses alternatives
• Vos personnages avec leur définition, et les informations de ceux à qui vous avez parlé
• Vos personas et vos mémoires
• Un fichier JSON et, si vous le voulez, du texte brut

Comment ça marche :
1. Connectez-vous à Character.AI
2. Appuyez sur le bouton de l’extension
3. Appuyez sur « Enregistrer mes chats » et laissez l’onglet ouvert

Vous pouvez arrêter à tout moment : tout ce qui a été lu est enregistré. Ouvrez le fichier dans la visionneuse gratuite d’amavie.ai, qui le lit dans votre navigateur.

L’extension ne demande aucun accès à l’avance et ne fonctionne que dans l’onglet où vous appuyez sur le bouton. Elle ne fait que lire, ne parle qu’à Character.AI avec votre session, sans analyse ni serveurs à elle. Code ouvert, licence MIT.

Fait par Amavie. Sans lien avec Character Technologies, Inc. Character.AI est une marque de son propriétaire.

### it

Salva le tue chat di Character.AI in un file sul computer, in pochi minuti. L’export ufficiale può richiedere 3-4 settimane, e il link per scaricare scade dopo 7 giorni.

Cosa ottieni:
• Tutte le chat in ordine, con autore e ora di ogni battuta
• Le risposte alternative
• I tuoi personaggi con le definizioni e i dati di quelli con cui hai parlato
• Le tue personas e le memorie
• Un file JSON e, se vuoi, testo semplice

Come funziona:
1. Accedi a Character.AI
2. Premi il pulsante dell’estensione
3. Premi «Salva le mie chat» e lascia aperta la scheda

Puoi fermarti quando vuoi: quanto letto viene salvato. Apri il file nel visualizzatore gratuito di amavie.ai, che lo legge nel tuo browser.

Non chiede accesso in anticipo e funziona solo nella scheda in cui premi il pulsante. Legge soltanto, parla solo con Character.AI con la tua sessione, senza analisi né server propri. Codice aperto, licenza MIT.

Fatto da Amavie. Senza legami con Character Technologies, Inc. Character.AI è un marchio del suo proprietario.

### ja

Character.AIの自分のチャットを、数分でパソコンのファイルに保存できます。公式のエクスポートには3〜4週間かかることがあり、ダウンロードリンクは7日で切れます。

保存できるもの：
• すべてのチャットを順番どおりに、各発言の書き手と日時つきで
• 選ばなかった別の返事
• 自分のキャラクターの定義と、話した相手のキャラクター情報
• ペルソナとメモリー
• JSONファイル1つ、必要ならテキストも

使い方：
1. Character.AIにログインする
2. 拡張機能のボタンを押す
3. 「チャットを保存する」を押して、タブを開いたままにする

いつでも止められ、読んだ分は保存されます。ファイルはamavie.aiの無料ビューアでブラウザの中で開けます。

事前のアクセス許可は求めず、ボタンを押したタブでだけ動きます。読み取りだけを行い、あなたのセッションでCharacter.AIとだけ通信します。分析も独自サーバーもありません。オープンソース（MITライセンス）。

提供：Amavie。Character Technologies, Inc.とは関係ありません。Character.AIはその所有者の商標です。

### ko

Character.AI의 내 채팅을 몇 분 만에 컴퓨터의 파일로 저장하세요. 공식 내보내기는 3~4주가 걸릴 수 있고, 다운로드 링크는 7일이면 만료됩니다.

저장되는 것:
• 모든 채팅을 순서대로, 각 대사의 작성자와 시간까지
• 넘겨서 볼 수 있던 다른 답장
• 내가 만든 캐릭터의 정의와 대화한 캐릭터의 정보
• 페르소나와 메모리
• JSON 파일 하나, 원하면 일반 텍스트도

사용 방법:
1. Character.AI에 로그인합니다
2. 확장 프로그램 버튼을 누릅니다
3. "내 채팅 저장"을 누르고 탭을 열어 둡니다

언제든 멈출 수 있고, 읽은 내용은 저장됩니다. 파일은 amavie.ai의 무료 뷰어에서 브라우저로 열 수 있습니다.

미리 접근 권한을 요청하지 않으며 버튼을 누른 탭에서만 작동합니다. 읽기만 하고, 내 세션으로 Character.AI와만 통신하며, 분석 도구도 자체 서버도 없습니다. 오픈 소스(MIT 라이선스).

Amavie 제작. Character Technologies, Inc.와 관련 없습니다. Character.AI는 그 소유자의 상표입니다.

### zh_CN

几分钟就能把你在 Character.AI 的聊天保存到电脑上的文件。官方导出可能需要 3 到 4 周，下载链接 7 天后失效。

你会得到：
• 按顺序排列的所有聊天，每句话都标明作者和时间
• 可以滑动查看的其他回复
• 你创建的角色及其定义，以及聊过的角色的信息
• 你的人设和记忆
• 一个 JSON 文件，也可以保存为纯文本

使用方法：
1. 登录 Character.AI
2. 按下扩展程序的按钮
3. 按“保存我的聊天”，并保持标签页打开

随时可以停止，已读取的内容都会保存。文件可以在 amavie.ai 的免费查看器里打开，在你的浏览器中读取。

不预先请求访问权限，只在你按下按钮的标签页运行。只读取，只用你的会话与 Character.AI 通信，没有统计分析，也没有自己的服务器。开源，MIT 许可。

由 Amavie 制作。与 Character Technologies, Inc. 无关。Character.AI 是其所有者的商标。
