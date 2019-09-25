//アクセス情報は外部に記載
var ACCESS_TOKEN = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("hidden").getRange(1, 2).getValue();
var primeGroupId = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("hidden").getRange(2, 2).getValue();

function doPost(e) {
  // WebHookで受信した応答用Token
  var replyToken = JSON.parse(e.postData.contents).events[0].replyToken;
  // ユーザーのメッセージを取得
  var userMessage = JSON.parse(e.postData.contents).events[0].message.text;
  // グループIDを取得
  var groupId = JSON.parse(e.postData.contents).events[0].source.groupId;
  // ユーザーIDを取得
  var userId = JSON.parse(e.postData.contents).events[0].source.userId;
  // 応答メッセージ用のAPI URL
  var url = "https://api.line.me/v2/bot/message/reply";
  //ユーザーIDからプロフィール情報を抜き出すリクエストURL
  var getProfileUrl = "https://api.line.me/v2/bot/profile/" + userId;

  //シートの情報を取得
  ss = SpreadsheetApp.getActiveSpreadsheet();
  sheet = ss.getSheetByName("garbageList");

  //現在の曜日を取得
  var weekDayNumber = new Date().getDay();

  //ゴミ出し日の情報をシートから取得
  var weekDayName = sheet.getRange(weekDayNumber + 1, 1).getValue();
  var garbageName = sheet.getRange(weekDayNumber + 1, 2).getValue();

  //送られてきた情報をスプレッドシートに取り込む
  msgInfoGetter(groupId, 1);
  msgInfoGetter(userMessage, 2);
  msgInfoGetter(userId, 3);

  //replyフラグの作成。特定MSG受信時のみ返信する
  var willReply = false;
  // 受信メッセージに応じてリプライ
  var replyMsg;
  if (
    userMessage.indexOf("だしたよ") !== -1 ||
    userMessage.indexOf("出したよ") !== -1 ||
    userMessage.indexOf("ダシタヨ") !== -1 
  ) {
    //ユーザー名を取得して返信の頭につける

    var headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + ACCESS_TOKEN
    };

    var options = {
      method: "get",
      headers: headers
    };

    var userResponseData = UrlFetchApp.fetch(getProfileUrl, options);
    var userName = JSON.parse(userResponseData).displayName;
    msgInfoGetter(userResponseData, 4);
    replyMsg = "ちゃんとゴミを出した " + userName + " はきむいね";
    willReply = true;
  } else if (userMessage === "やだ") {
    replyMsg = "ゴミ出せゴルァ！";
    willReply = true;
  } else if (userMessage === "あ") {
    replyMsg = "あンゴ";
    willReply = true;
  } else if (
    userMessage === "忘れた" ||
    userMessage.indexOf("ゴミ出し？") !== -1
  ) {
    replyMsg = "次は" + garbageName + "の日だ！ 忘れんなよ！";
    willReply = true;
  }

  //フラグがOFFの時は処理を中止
  if (!willReply) {
    return;
  }

  //投稿データを作成
  var postData = {
    replyToken: replyToken,
    messages: [
      {
        type: "text",
        text: replyMsg
      }
    ]
  };
  var headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + ACCESS_TOKEN
  };

  var options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(postData)
  };

  var response = UrlFetchApp.fetch(url, options);

  return ContentService.createTextOutput(
    JSON.stringify({ content: "post ok" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function msgInfoGetter(info, row) {
  ss = SpreadsheetApp.getActiveSpreadsheet();
  sheet = ss.getSheetByName("roomId");
  valueCell = sheet.getRange(row, 1);
  valueCell.setValue(info);
}

function weekdaySender() {
  //シートの情報を取得
  ss = SpreadsheetApp.getActiveSpreadsheet();
  sheet = ss.getSheetByName("garbageList");

  //現在の曜日を取得
  var weekDayNumber = new Date().getDay();

  //ゴミ出し日の情報をシートから取得
  var weekDayName = sheet.getRange(weekDayNumber + 1, 1).getValue();
  var garbageName = sheet.getRange(weekDayNumber + 1, 2).getValue();

  //投稿データを作成
  var postData = {
    to: primeGroupId,
    messages: [
      {
        type: "text",
        text: "今日は" + weekDayName + "だ！ " + garbageName + "の日だぞ！"
      }
    ]
  };

  var url = "https://api.line.me/v2/bot/message/push";
  var headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + ACCESS_TOKEN
  };

  var options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(postData)
  };
  var response = UrlFetchApp.fetch(url, options);
}
