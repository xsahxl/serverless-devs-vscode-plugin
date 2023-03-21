const vscode = acquireVsCodeApi();

new Vue({
  el: "#app",
  data: {
    templates: [],
    activeTab: "",
    applist: [],
    pageStatus: "search",
    keyword: "",
    applicationList: {},
    originalApplicationList: {},
    aliasList: {},
    categoryListRes: {},
    requireConfig: {},
    currentAppParams: {},
    paramRequired: {},
    configItems: {
      access: "",
      path: "",
      dirName: "",
    },
  },
  created() {
    document.getElementById("app").style.display = "none";
    this.configItems.path = this.$config.defaultPath;
    vscode.postMessage({
      command: "requestData",
      sort: "download",
    });
  },
  mounted() {
    window.addEventListener("message", this.onMessage);
  },
  beforeDestroy() {
    window.removeEventListener("message", this.onMessage);
  },
  computed: {
    // 加条'all'选项
    categoryList: function () {
      return {
        0: "All",
        ...this.categoryListRes,
      };
    },
  },
  methods: {
    onMessage(event) {
      switch (event.data.command) {
        case "responseData":
          this.templates = event.data.templates;
          this.activeTab = _.first(this.templates).key;
          this.applist = _.first(this.templates).items;
          this.aliasList = event.data.aliasList;
          document.getElementById("app").style.display = "block";
          document.getElementById("appLoading").style.display = "none";
          break;

        case "getParams":
          this.currentAppParams = event.data.params.properties;
          this.paramRequired = event.data.params.required;
          for (const i in this.currentAppParams) {
            this.configItems[i] = this.currentAppParams[i]["default"];
          }
          break;

        case "updatePath":
          this.configItems.path = event.data.path;
          break;
      }
    },
    handleTagChange(value) {
      this.activeTab = value;
      const tmp = _.find(
        this.templates,
        (tab) => String(tab.key) === String(value)
      );
      if (_.isEmpty(this.keyword)) {
        return (this.applist = tmp.items);
      }
      const newData = _.filter(tmp.items, (item) => {
        const title = _.get(item, "title", "");
        return _.includes(title.toLowerCase(), this.keyword.toLowerCase());
      });
      return (this.applist = newData);
    },
    updateKeyword(event) {
      this.keyword = event.target.currentValue;
      this.search();
    },
    search() {
      const tmp = _.find(
        this.templates,
        (tab) => String(tab.key) === String(this.activeTab)
      );
      if (_.isEmpty(this.keyword)) {
        return (this.applist = tmp.items);
      }
      const newData = _.filter(tmp.items, (item) => {
        const title = _.get(item, "title", "");
        return _.includes(title.toLowerCase(), this.keyword.toLowerCase());
      });
      console.log(newData);
      return (this.applist = newData);
    },
    sortBySelected(event) {
      vscode.postMessage({
        command: "requestData",
        sort: event.target.ariaActiveDescendant,
      });
    },
    switchStatus(status, appname) {
      if (status === "init") {
        vscode.postMessage({
          command: "getParams",
          selectedApp: appname,
        });
        this.configItems["access"] = this.aliasList[0];
        this.configItems["path"] = this.$config.defaultPath;
        this.configItems["dirName"] = appname;
      }
      this.pageStatus = status;
      this.selectedApp = appname;
    },
    filterAppList(type, val) {
      if (type === "category" && val !== "All") {
        this.applicationList = _.filter(
          this.originalApplicationList,
          function (o) {
            return o.tags.indexOf(val) !== -1;
          }
        );
      } else if (type === "category" && val === "All") {
        this.applicationList = this.originalApplicationList;
      }
    },
    openUrl(appName) {
      vscode.postMessage({
        command: "openUrl",
        appName: appName,
      });
    },
    isRequire(name) {
      return this.paramRequired.indexOf(name) > -1;
    },
    setConfigItem(name, event) {
      if (event.target.currentValue.length === 0) {
        this.configItems[name] = this.currentAppParams[name]["default"];
      } else {
        this.configItems[name] = event.target.currentValue;
      }
    },
    setInitPath() {
      vscode.postMessage({
        command: "setInitPath",
      });
    },
    initApplication() {
      vscode.postMessage({
        command: "initApplication",
        selectedApp: this.selectedApp,
        configItems: this.configItems,
      });
    },
  },
});
