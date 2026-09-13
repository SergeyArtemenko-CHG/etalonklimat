"use strict";

class ProjectApp {
    constructor() {
        this.classes = {};

        this.components = {};

        this.helpers = {};

        this.modules = {
            Form: require('./modules/Form').default,
            D3js: require('./modules/D3js').default,
        };

        this.pages = {};
    }
}

document.addEventListener('DOMContentLoaded', () => {
    global.ProjectApp = new ProjectApp();
});
