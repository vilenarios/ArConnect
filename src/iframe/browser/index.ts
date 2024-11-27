import enDic from "url:/assets/_locales/en/messages.json";
import zhCnDic from "url:/assets/_locales/zh_CN/messages.json";
import type { Alarms, Runtime } from "webextension-polyfill";

// TODO: Missing storage.onChanged.addListener

interface AlarmWithTimer extends Alarms.Alarm {
  timeoutID?: number;
  intervalID?: number;
}

const alarmsByName: Record<string, AlarmWithTimer> = {};

type AlarmCallback = (alarm?: Alarms.Alarm) => void;

const alarmCallbacks: AlarmCallback[] = [];

function invokeAlarms(name: string) {
  const alarmWithTimer = alarmsByName[name];

  if (!alarmWithTimer) return;

  alarmCallbacks.forEach((alarmCallback) => {
    alarmCallback({
      name: alarmWithTimer.name,
      scheduledTime: alarmWithTimer.scheduledTime,
      periodInMinutes: alarmWithTimer.periodInMinutes,
    });
  });
}

const alarms = {
  create: (name: string, alarmInfo: Alarms.CreateAlarmInfoType) => {
    const periodInMs = (alarmInfo.periodInMinutes ?? -1) * 60000;
    const delayInMs = alarmInfo.when ? (
      alarmInfo.when - Date.now()
    ) : (
      (alarmInfo.delayInMinutes ?? -1) * 60000
    );

    const alarmWithTimer: AlarmWithTimer = {
      name,
      scheduledTime: 0,
      periodInMinutes: alarmInfo.periodInMinutes,
    };

    alarmsByName[name] = alarmWithTimer;

    // TODO: Record last alarm run in localStorage to continue the alarm when reloading...

    if (delayInMs === 0) {
      alarmWithTimer.scheduledTime = Date.now();
      invokeAlarms(name);
    } else if (delayInMs > 0) {
      alarmWithTimer.scheduledTime = Date.now() + delayInMs;

      alarmWithTimer.timeoutID = setTimeout(() => {
        delete alarmWithTimer.timeoutID;

        invokeAlarms(name);

        alarmWithTimer.scheduledTime = Date.now() + periodInMs;

        alarmWithTimer.intervalID = setInterval(() => {
          alarmWithTimer.scheduledTime = Date.now() + periodInMs;

          invokeAlarms(name);
        }, periodInMs);
      }, delayInMs);
    }

    if (delayInMs <= 0 && periodInMs > 0) {
      alarmWithTimer.scheduledTime = Date.now() + periodInMs;

      alarmWithTimer.intervalID = setInterval(() => {
        alarmWithTimer.scheduledTime = Date.now() + periodInMs;

        invokeAlarms(name);
      }, periodInMs);
    }
  },
  clear: (name: string) => {
    const alarmWithTimer = alarmsByName[name];

    if (!alarmWithTimer) return;

    if (alarmWithTimer.timeoutID) clearTimeout(alarmWithTimer.timeoutID);
    if (alarmWithTimer.intervalID) clearTimeout(alarmWithTimer.intervalID);
  },
  getAll: () => {
    return Promise.resolve(Object.values(alarmsByName) satisfies Alarms.Alarm[]);
  },
  get: (name: string) => {
    const alarmWithTimer = alarmsByName[name];

    if (!alarmWithTimer) return;

    return {
      name: alarmWithTimer.name,
      scheduledTime: alarmWithTimer.scheduledTime,
      periodInMinutes: alarmWithTimer.periodInMinutes,
    };
  },
  onAlarm: {
    addListener: (alarmCallback: AlarmCallback) => {
      alarmCallbacks.push(alarmCallback);
    },
  },
};

const dictionaries = {
  en: enDic as unknown as Record<
    string,
    { message: string; description: string }
  >,
  "zh-CN": zhCnDic as unknown as Record<
    string,
    { message: string; description: string }
  >
} as const;

const i18n = {
  getMessage: (key: string) => {
    const dictionaryLanguage =
      navigator.languages.find((language) => {
        return dictionaries.hasOwnProperty(language);
      }) || "en";

    const dictionary = dictionaries[dictionaryLanguage];
    const value = dictionary[key]?.message;

    if (!value) {
      console.warn(`Missing ${dictionaryLanguage} translation for ${key}.`);
    }

    // TODO: Default to English instead?
    return value || `<${key}>`;
  }
};

// The 2 polyfill below should address lines like this:
// browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

const runtime = {
  getURL: (path: string) => {
    console.trace("getURL()");

    return new URL(path, document.location.origin).toString();
  },
  getManifest: () => {
    return {
      browser_action: {
        default_popup: "popup.html"
      }
    };
  },
  onInstalled: {
    addListener: (fn) => {
      fn({ reason: "install", temporary: false } satisfies Runtime.OnInstalledDetailsType);
    },
  },

  // TODO: onConnect is probably not needed once I replace onMessage/sendMessage with isomorphicOnMessage and
  // isomorphicSendMessage (using the env variable).
};

const tabs = {
  create: async ({ url }) => {
    console.log(`Go to ${url}`);

    // URL =
    // browser.runtime.getURL("tabs/welcome.html")
    // browser.runtime.getURL("tabs/dashboard.html#/contacts")
    // browser.runtime.getURL("assets/animation/arweave.png");
    // browser.runtime.getURL("tabs/auth.html")}?${objectToUrlParams(...)}
    // `tabs/dashboard.html#/apps/${activeApp.url}`

    if (url === "tabs/welcome.html") {
      location.hash = "/welcome";
    } else if (url.startsWith("tabs/dashboard.html#")) {
      const hash = url.split("#").pop();

      location.hash = `/quick-settings${hash}`;
    } else if (url.startsWith("tabs/auth.html")) {
      console.warn(
        "Auth popup routes not added to the embedded wallet iframe router!"
      );

      const paramsAndHash = url.replace("tabs/auth.html", "");

      location.hash = `/auth${paramsAndHash}`;
    } else if (url.startsWith("assets")) {
      throw new Error(`Cannot create tab for URL = ${url}`);
    } else {
      throw new Error(`Cannot create tab for URL = ${url}`);
    }
  },
  query: async () => {
    const parentURL =
      window.location === window.parent.location
        ? document.location.href
        : document.referrer;

    return { url: parentURL }; // satisfies browser.Tabs.Tab
  },
  onConnect: {
    addListener: () => {},
    removeListener: () => {}
  },
  onUpdated: {
    addListener: () => {},
    removeListener: () => {}
  }
};

export default {
  alarms,
  i18n,
  runtime,
  tabs
};
