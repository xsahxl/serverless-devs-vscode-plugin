import * as vscode from "vscode";
import { init } from "../commands/init";
import * as core from "@serverless-devs/core";
import { activeApplicationWebviewPanel } from "../pages/registry";
const { lodash: _, generateRandom } = core;
const fetch = require("node-fetch");
import localize from "../localize";
var qs = require("qs");
const lang = vscode.env.language === "en" ? "en" : "zh";

export const attrList = {
  category: {
    url: `https://registry.devsapp.cn/console/tabs?type=fc&lang=${lang}`,
    id: "categorylist",
  },
  provider: {
    url: "https://registry.devsapp.cn/common/provider",
    id: "providerlist",
  },
  application: {
    url: `https://registry.devsapp.cn/console/applications?type=fc&lang=${lang}`,
    id: "applicationlist",
  },
  params: {
    url: `https://registry.devsapp.cn/package/param?lang=${lang}`,
    id: "appParams",
  },
};

export async function pickCreateMethod(context: vscode.ExtensionContext) {
  const result = await vscode.window.showQuickPick(
    [
      {
        label: localize("vscode.template"),
        value: "template",
      },
      {
        label: "Registry",
        value: "registry",
      },
    ],
    {
      placeHolder: localize("vscode.how.do.you.want.to.create.your.app"),
    }
  );

  if (result.value === "template") {
    await init(context);
  } else if (result.value === "registry") {
    activeApplicationWebviewPanel(context);
  }
}

export async function setInitPath() {
  const options: vscode.OpenDialogOptions = {
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
    openLabel: localize("vscode.select.this.path"),
    defaultUri: vscode.Uri.file(
      core.getRootHome().slice(0, core.getRootHome().lastIndexOf("/"))
    ),
  };
  const selectFolderUri = await vscode.window.showOpenDialog(options);
  if (selectFolderUri) {
    return selectFolderUri[0];
  }
}

export function replaceDefaultConfig(config: any) {
  for (let i in config["properties"]) {
    if (
      config["properties"][i].hasOwnProperty("default") &&
      _.endsWith(config["properties"][i]["default"], "${default-suffix}")
    ) {
      config["properties"][i]["default"] = _.replace(
        config["properties"][i]["default"],
        "${default-suffix}",
        generateRandom()
      );
    }
  }
  return config;
}

export async function responseData(panel: vscode.WebviewPanel, sort: string) {
  const categoryFetch = await fetch(attrList["category"]["url"]);
  const applicationFetch = await fetch(attrList["application"]["url"]);
  const applicationRes = await applicationFetch.json();
  const applicationList = _.get(applicationRes, "Response");

  const categoryRes = await categoryFetch.json();
  let tabs = _.map(_.get(categoryRes, "Response"), (tab) => ({
    key: tab.id,
    name: tab.name,
    items: _.sortBy(
      _.filter(applicationList, (app) => _.includes(app.tabs, tab.id)),
      "x-range"
    ),
  }));
  const one = tabs.shift();
  const allTemplate = lang === "en" ? "All Templates" : "所有模版";

  if (one) {
    tabs = [
      one,
      { key: "all", name: allTemplate, items: applicationList },
      ...tabs,
    ];
  } else {
    tabs = [{ key: "all", name: allTemplate, items: applicationList }, ...tabs];
  }

  panel.webview.postMessage({
    command: "responseData",
    templates: tabs,
    aliasList: await core.getCredentialAliasList(),
  });
}

export async function initProject(
  panel: vscode.WebviewPanel,
  config: any
): Promise<string> | undefined {
  try {
    const appPath: string = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
      },
      async (progress, token) => {
        progress.report({
          message: `Downloading: ${config.source}...`,
        });
        const appPath = await core.loadApplication(config);
        progress.report({
          message: `Downloaded: ${config.source}`,
        });
        return appPath;
      }
    );
    const newWindow = !!vscode.workspace.rootPath;
    if (newWindow) {
      panel.dispose();
    }
    vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(appPath),
      newWindow
    );
    return appPath;
  } catch (e) {
    vscode.window.showErrorMessage(e.message);
  }
}
