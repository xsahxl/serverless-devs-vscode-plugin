import * as vscode from 'vscode';
import { init } from '../commands/init';
import * as core from '@serverless-devs/core';
import { activeApplicationWebviewPanel } from '../pages/registry';

export const attrList = {
    "category": {
        "url": "https://registry.devsapp.cn/common/category",
        "id": "categorylist"
    },
    "provider": {
        "url": "https://registry.devsapp.cn/common/provider",
        "id": "providerlist"
    },
    "application": {
        "url": "https://registry.devsapp.cn/package/search",
        "id": "applicationlist"
    },
    "params": {
        "url": "https://registry.devsapp.cn/package/param",
        "id": "appParams"
    }
};

export async function pickCreateMethod(context: vscode.ExtensionContext) {
    const result = await vscode.window.showQuickPick(['模板', 'Registry'], {
        placeHolder: '您希望以哪种方式创建应用？',
    });

    vscode.window.showInformationMessage(`通过${result}创建应用.`);
    if (result === "模板") {
        await init(context);
    } else if (result === "Registry") {
        activeApplicationWebviewPanel(context);
    }
}

export async function setInitPath() {
    const options: vscode.OpenDialogOptions = {
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: "选择这个路径",
        defaultUri: vscode.Uri.file(core.getRootHome().slice(0, core.getRootHome().lastIndexOf('/'))),
    };
    const selectFolderUri = await vscode.window.showOpenDialog(options);
    if (selectFolderUri) {
        return selectFolderUri[0];
    }
}

export async function initProject(
    panel: vscode.WebviewPanel,
    config: any
    ) {
    try {
        const appPath = await vscode.window.withProgress(
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
        if (newWindow) { panel.dispose(); }
        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(appPath), newWindow);
      } catch (e) {
        vscode.window.showErrorMessage(e.message);
      }
}