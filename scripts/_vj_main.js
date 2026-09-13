function getCsrfToken() {
    // Из meta
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) return meta.getAttribute('content');
    // Фолбэк на window (если вывели туда)
    if (window.CSRF_TOKEN) return window.CSRF_TOKEN;
    return '';
}
function getBxSessId() {
    if (window.BX && BX.bitrix_sessid) return BX.bitrix_sessid();
    const meta = document.querySelector('meta[name="bitrix-sessid"]');
    return meta ? meta.getAttribute('content') : '';
}
function parseStringToArray(inputString) {
    return inputString.split('; ').map(item => {
        const [key, value] = item.split('; ').map(part => part.trim());
        return {key, value};
    });
}
function compareKeys(parsedArray, keysArray) {
    return parsedArray.filter(item => keysArray[item.key]);
}
function toAbsoluteUrl(relativeUrl) {
    if (/^(?:[a-z]+:)?\/\//i.test(relativeUrl)) return relativeUrl; // уже абсолютный
    return window.location.origin + relativeUrl;
}
function openPdfInNewTab(pdfPath) {
    const absUrl = toAbsoluteUrl(pdfPath);

    const link = document.createElement('a');
    link.href = absUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function extractNumberOrNaN(val) {
    if (val == null) return NaN;
    const s = String(val);

    // Удаляем SVG и любые HTML-теги
    const noSvg = s.replace(/<svg[\s\S]*?<\/svg>/gi, '');
    const clean = noSvg.replace(/<[^>]*>/g, ' ');

    // Ищем первое число (поддержка десятичной запятой/точки)
    const m = clean.match(/-?\d+(?:[.,]\d+)?/);
    if (!m) return NaN;

    const num = Number(m[0].replace(',', '.'));
    return Number.isFinite(num) ? num : NaN;
}

function textKey(val) {
    if (val == null) return '';
    // Удаляем SVG/HTML и нормализуем пробелы
    return String(val)
        .replace(/<svg[\s\S]*?<\/svg>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function getUFConcOptions(data, liquidId = 'Вода') {
    if (!data) return [];

    // Если пришёл JSON-строкой — попробуем распарсить
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { return []; }
    }
    if (typeof data !== 'object') return [];

    // Нормализуем ключ жидкости
    const key = liquidId != null ? String(liquidId).trim() : 'Вода';
    const fluid = (key in data) ? data[key] : data['Вода'];
    if (!fluid || typeof fluid !== 'object') return [];

    const conc = fluid.UF_CONC;
    if (!conc || typeof conc !== 'object') return [];

    // Берём только числовые ключи, сортируем и возвращаем [{id, name}]
    return Object.keys(conc)
        .map(k => ({ raw: k, num: Number(k) }))
        .filter(x => Number.isFinite(x.num))
        .sort((a, b) => a.num - b.num)
        .map(x => ({ id: x.num, name: (x.num * 100) }));
}
const app = Vue.createApp({
    components: {
        Multiselect: window.VueMultiselect.default,
        'vue-slider': window['vue-slider-component']
    },
    data() {
        return {
            displayData: [],
            isMaxTempOutOfRange: false,
            _maxTempOutOfRangeTimer: null,
            showNPSHblock: false,
            activeTabPrev: 'quick',
            sort: { key: 5, direction: 'asc' },
            sortableColumns: [1, 2, 3, 4, 5],
            isModalOpen: false,
            textList: '',
            textListArt: '',
            textListCount: '',
            currentImage: '',
            nameNasos: '',
            isLoadingButton: false, // Состояние загрузки
            isLoadingButtonGBL: false, // Состояние загрузки
            isLoadingButtonD: false, // Состояние загрузки
            isLoadingButtonList: false, // Состояние загрузки
            svg: '',
            idIndoAnalId: '',
            svg2: '',
            selectedApplication: '',
            liquidValue: '',
            selectedEquipmentTypes: [],
            equipmentTypes: [],
            selectedSizeTypes: [],
            selectedServiceFactor: [],
            sizeTypes: [],
            serviceFactor: [],
            analog: {
                rpat: 'Совпадает',
                t: 'Может различаться',
                pw: 'Может различаться',
                pVikl: 'Может различаться',
                pViklQ: 'Может различаться',
                dl: 'Совпадает',
                dlV: 'Может различаться'
            },
            selectedUnits: {
                power: 'кВт',
                flow: 'м³/ч',
                pressure: 'м',
                staticPressure: 'м',
                concentration: '%',
                density: 'кг/м³'
            },
            defaultParams: {
                applications: [],
                liquid: [],
                concentrationValueID: [],
                equipmentTypes: [],
                sizeTypes: [],
                serviceFactor: [],
                bodyMaterialCount: [],
                wheelMaterialCount: [],
                wheelTypeOptions: [],
                wheelTypeCount: [],
                wheelTypeCountFree: [],
                dischargeSizes: [],
                suctionSizes: [],
                typeMontag: [],
                timeWork: [],
                vsPopVikl: [],
                vsPopViklQ: [],
                powers: [],
                phaseCounts: [],
                poleCounts: [],
            },
            analogDl: ['Может различаться', 'Совпадает'],
            analogDlV: ['Может различаться', 'Совпадает'],
            analogPw: ['Может различаться', 'Совпадает'],
            analogPvikl: ['Может различаться', 'Совпадает'],
            analogPviklQ: ['Может различаться', 'Совпадает'],
            analogT: ['Может различаться', 'Совпадает'],
            analogRpat: ['Может различаться', 'Совпадает'],
            unitsFlow: ['м³/ч','м³/мин','м³/с','л/ч','л/мин','л/с'],
            unitsConcentration: ['%'],
            unitsDensity: ['кг/м³'],
            unitsPower: ['кВт'],
            units: ['м','кПа','МПа','бар'],
            applications: [],
            liquid: [],
            _fullLiquidBackup: null,
            concentrationValueID: [],
            activeTab: 'quick', // Инициализация активного таба
            tabs: [
                {id: 'quick', label: 'Быстрый подбор', content: 'Подбор оборудования по параметрам системы'},
                {
                    id: 'extended',
                    label: 'Расширенный подбор',
                    content: 'Подбор оборудования по параметрам системы и оборудования'
                },
                {
                    id: 'analog',
                    label: 'Подбор по аналогам',
                    content: 'Замена оборудования других брендов<br/>на насосы '+window.domenCustom
                },
                {id: 'search', label: 'Поиск', content: 'Поиск по названию или артикулу оборудования '+window.domenCustom}
            ],
            rightPanelContent: '', // Контент для правой панели
            dataTableContent: [],
            tableHeaders: [],
            showInputPopup: false,
            showInputPopupCustom: false,
            dateCreated: '',
            addNumber: '',
            showPopup: false,
            showPopupError: false,
            showPopupErrorList: false,
            showPopupErrorListGBL: false,
            showPopupErrorDuble: false,
            showNoAdd: 'N',
            showPopupErrorReq: false,
            showPopupErrorReqVS: false,
            showPopupErrorReqVSsr: false,
            showPopupErrorReqVSsrQ: false,
            showPopupAnalError: false,
            showPopupAnalDataError: false,
            showPromiseAlert: false,
            watermark: '',
            activePopupTab: 'hydraulic',
            popupParams: {
                parallelConnection: '',
                reservePumps: '',
                adjustableFrequency: '',
                qhMargin: '',
                addCustomGraph: '',
                hidePrice: '',
                hidePriceQ: '',
                hideArticle: '',
                hideArticleQ: ''
            },
            selectedBackupPumps: '',
            isUpdating: false,
            selectedParallelConnection: null,
            selectedBackupPumps: '',
            parallelConnectionOptions: Array.from({ length: 10 }, (v, i) => ({
                value: i + 1,
                text: `${i + 1}`
            })),
            backupPumpsOptions: Array.from({ length: 9 }, (v, i) => ({
                value: i + 1,
                text: `${i + 1}`
            })),
            //parallelConnectionOptions: this.generateBackupPumpsOptions(),
            //backupPumpsOptions: this.generateBackupPumpsOptionsZ(),
            selectedParallelConnection: '',
            addCustomGraph: false,
            customGraph: {
                name: '',
                points: Array.from({length: 5}, () => ({q: null, h: null}))
            },
            flowValue: '', // Для расхода
            pressureValue: '', // Для напора
            staticPressureValue: '', // Для статического напора
            liquidValueDefault: 'Вода', // Для жидкости
            maxTempValue: 20, // Для максимальной температуры
            concentrationValue: 1, // Для концентрации
            densityValue: '998.2', // Для плотности
            densityValueV: '', // Для плотности
            articleInput: '',
            selectedDischargeSizes: [], // Выбранные размеры напорного патрубка
            dischargeSizes: [], // Доступные размеры напорного патрубка
            selectedSuctionSizes: [], // Выбранные размеры всасывающего патрубка
            selectedTypeMontag: [], // Выбранные размеры всасывающего патрубка
            selectedTimeWork: [], // Выбранные размеры всасывающего патрубка
            selectedVsPopVikl: [], // Выбранные размеры всасывающего патрубка
            selectedVsPopViklQ: [], // Выбранные размеры всасывающего патрубка
            suctionSizes: [], // Доступные размеры всасывающего патрубка
            typeMontag: [], // Доступные размеры всасывающего патрубка
            timeWork: [], // Доступные размеры всасывающего патрубка
            vsPopVikl: [], // Доступные размеры всасывающего патрубка
            vsPopViklQ: [], // Доступные размеры всасывающего патрубка
            selectedPowers: [], // Выбранные мощности
            powers: [], // Доступные мощности
            selectedPhaseCount: '', // Выбранное количество фаз
            phaseCounts: [], // Доступные количества фаз
            selectedPoleCount: '', // Выбранное количество полюсов
            poleCounts: [], // Доступные количества полюсов
            selectedManufacturer: [{id: 'Grundfos', name: 'Grundfos'}], // Значение по умолчанию
            allNames: [], // Массив для хранения всех наименований
            filteredNames: [], // Массив для хранения отфильтрованных наименований
            selectedName: null, // Выбранное наименование
            manufacturers: [], // Массив для хранения производителей
            selectedRow: null,
            activeMainTab: 'chart', // По умолчанию активен таб "График"
            activeMainTabChert: '', // По умолчанию активен таб "График"
            chartDataShow: null,
            chartDataShowF: null,
            chartDataShowC: null,
            chartData: null,
            photoData: null,
            drawingData: null,
            gabChert: null,
            elSchema: null,
            schemMon: null,
            docData: null,
            techData: null,
            techDataBim: null,
            techDataDwg3D: null,
            techDataDwg2D: null,
            techDataGig: null,
            techDataSertSeq: null,
            techDataCatInfo: null,
            techDataSerInfo: null,
            techDataRukInfo: null,
            isLoading: false, // Состояние для прелоадера
            showAnalog: false, // Состояние для прелоадера
            showAnalogPop: false, // Состояние для прелоадера
            showAnalogPopRNP: false, // Состояние для прелоадера
            showAnalogPopNM: false, // Состояние для прелоадера
            showAnalogPopF: false, // Состояние для прелоадера
            showAnalogPopTM: false, // Состояние для прелоадера
            showAnalogPopMD: false, // Состояние для прелоадера
            showAnalogPopMDV: false, // Состояние для прелоадера
            showAnalogPopPV: false, // Состояние для прелоадера
            bodyMaterial: '', // 1) Материал корпуса
            bodyMaterialCount: [], // 1) Материал корпуса
            wheelMaterial: '', // 2) Материал рабочего колеса
            wheelMaterialCount: [], // 2) Материал рабочего колеса
            //typeMaterial: '', // 2) Материал рабочего колеса
            //typeMaterialCount: [], // 2) Материал рабочего колеса
            wheelType: '', // 3) Тип рабочего колеса
            wheelTypeCount: [], // 3) Тип рабочего колеса
            wheelTypeCountFree: [], // 3) Тип рабочего колеса
            maxWorkingPressure: '', // 4) Max рабочее давление
            maxWorkingPressureFree: '', // 4) Max рабочее давление
            maxWorkingPressureFreeFrom: null,
            maxWorkingPressureFreeTo: null,
            sliderRange: [0, 0],
            wheelTypeOptions: [], // Опции для типа рабочего колеса
            analogInfoBlock: [], // Опции для типа рабочего колеса
            additionalParamsShow: true,
            customTypeFilter: '',
            tolerance: '',
            anal: '',
            frequencyControl: false,
            frequencyControlZon: false,
            frequencyControlZonService: false,
            downLoadArtFull: false,
            count: 50,
            page: 50,
            pageOne: true,
            pageTwo: true,
            pageThree: true,
            pageFor: true,
            pageFive: true,
            pageSix: true,
            pageOneShow: true,
            pageTwoShow: true,
            pageThreeShow: true,
            pageForShow: true,
            pageFiveShow: true,
            pageSixShow: true,
            gbl: '',
            liquidCustom: '',
            liquidCustomCon: [],
        };
    },
    computed: {
        wheelTypeCountFreeSorted() {
            const arr = Array.isArray(this.wheelTypeCountFree)
                ? [...this.wheelTypeCountFree]
                : Object.values(this.wheelTypeCountFree || {});
            return arr.sort((a, b) => this.parseNum(a.id) - this.parseNum(b.id));
        },


        // Опции для "От" — не больше выбранного "До"
        optionsFrom() {
            if (!this.maxWorkingPressureFreeTo) return this.wheelTypeCountFreeSorted;
            const toVal = this.parseNum(this.maxWorkingPressureFreeTo.id);
            return this.wheelTypeCountFreeSorted.filter(
                o => this.parseNum(o.id) <= toVal
            );
        },

        // Опции для "До" — не меньше выбранного "От"
        optionsTo() {
            if (!this.maxWorkingPressureFreeFrom) return this.wheelTypeCountFreeSorted;
            const fromVal = this.parseNum(this.maxWorkingPressureFreeFrom.id);
            return this.wheelTypeCountFreeSorted.filter(
                o => this.parseNum(o.id) >= fromVal
            );
        },

        sliderCurrentLabel() {
            const opts = this.wheelTypeCountFreeSorted;
            if (!opts.length) return '';
            const [fromIdx, toIdx] = this.sliderRange;
            const from = opts[fromIdx];
            const to   = opts[toIdx];
            if (!from || !to) return '';
            return from.id === to.id ? from.name : `${from.name} — ${to.name}`;
        },

        currentLiquid() {
            const raw = this.liquidCustomCon?.[this.liquidValue?.id]?.['UF_CONC']?.[this.concentrationValue?.id];
            if (!raw) return null;

            try {
                return typeof raw === 'string' ? JSON.parse(raw) : raw;
            } catch (e) {
                console.error('Ошибка парсинга liquidCustomCon:', e);
                return null;
            }
        },

        // минимальный ключ UF_NU
        ufNuMinKey() {
            const ufNu = this.currentLiquid?.UF_NU;
            if (!ufNu || typeof ufNu !== 'object') return null;

            const keys = Object.keys(ufNu)
                .map(k => Number(k))
                .filter(k => !isNaN(k));

            return keys.length ? Math.min(...keys) : null;
        },

        // максимальный ключ UF_NU
        ufNuMaxKey() {
            const ufNu = this.currentLiquid?.UF_NU;
            if (!ufNu || typeof ufNu !== 'object') return null;

            const keys = Object.keys(ufNu)
                .map(k => Number(k))
                .filter(k => !isNaN(k));

            return keys.length ? Math.max(...keys) : null;
        },

        isActive() {
            return (
                (this.activeMainTab === 'chart' && this.chartData) ||
                (this.activeMainTab === 'photo' && this.photoData) ||
                (this.activeMainTab === 'drawing' && this.drawingData) ||
                (this.activeMainTab === 'techData' && this.techData) ||
                (this.activeMainTab === 'docData' && this.docData)
            );
        },
        /*sortedDataTableContent() {
            const rows = Array.isArray(this.dataTableContent)
                ? [...this.dataTableContent]
                : [];

            // если сортировка выключена — вернуть как есть
            if (this.sort.key !== 1 || !this.sort.direction) return rows;

            const dir = this.sort.direction === 'asc' ? 1 : -1;

            return rows.sort((a, b) => {
                // a[1] и b[1] — значение «Артикул»
                const av = a[1];
                const bv = b[1];

                // пробуем числовое сравнение, если не числа — лексикографическое
                const an = Number(av);
                const bn = Number(bv);

                if (!Number.isNaN(an) && !Number.isNaN(bn)) {
                    return (an - bn) * dir;
                }
                return String(av).localeCompare(String(bv), 'ru', { numeric: true }) * dir;
            });
        },*/
    },
    methods: {
        closeOnOverlay() {
            if (event.target === event.currentTarget) {
                this.showPromiseAlert = false;
            }
        },
        parseNum(val) {
            return parseFloat(String(val).replace(',', '.'));
        },
        onSliderChange(val) {
            const opts = this.wheelTypeCountFreeSorted;
            const [fromIdx, toIdx] = val;
            this.maxWorkingPressureFreeFrom = opts[fromIdx] || null;
            this.maxWorkingPressureFreeTo   = opts[toIdx]   || null;
            this.applyRange();
        },
        applyRange() {
            const options = this.wheelTypeCountFreeSorted;
            const from = this.maxWorkingPressureFreeFrom;
            const to   = this.maxWorkingPressureFreeTo;

            if (!from && !to) {
                this.maxWorkingPressureFree = [];
            } else {
                const fromVal = from ? this.parseNum(from.id) : -Infinity;
                const toVal   = to   ? this.parseNum(to.id)   :  Infinity;

                this.maxWorkingPressureFree = options.filter(opt => {
                    const v = this.parseNum(opt.id);
                    return v >= fromVal && v <= toVal;
                });
            }

            // Существующая логика
            this.resetCustomGrafTable && this.resetCustomGrafTable();
            this.filterSmartInfo && this.filterSmartInfo('maxWorkingPressureFree');
        },
        onRangeChange() {
            this.$nextTick(() => this.applyRange());
        },
        syncSliderFromSelects() {
            const opts = this.wheelTypeCountFreeSorted;
            if (!opts.length) return;

            const fromIdx = this.maxWorkingPressureFreeFrom
                ? opts.findIndex(o => o.id === this.maxWorkingPressureFreeFrom.id)
                : 0;
            const toIdx = this.maxWorkingPressureFreeTo
                ? opts.findIndex(o => o.id === this.maxWorkingPressureFreeTo.id)
                : opts.length - 1;

            const newRange = [
                fromIdx === -1 ? 0 : fromIdx,
                toIdx   === -1 ? opts.length - 1 : toIdx
            ];

            if (newRange[0] !== this.sliderRange[0] || newRange[1] !== this.sliderRange[1]) {
                this.sliderRange = newRange;
            }
        },
        normalizeText(s) {
            return (s || "").replace(/\s+/g, " ").trim();
        },
        /*applyTwoLinesWithAutoWidth() {
            const table = this.$refs.dataTable;
            if (!table) return;

            const theadRow = table.tHead?.rows?.[0];
            const cols = Array.from(table.querySelectorAll("colgroup col"));
            if (!theadRow || !cols.length) return;

            const ths = Array.from(theadRow.cells);

            const EXTRA = 30;     // запас под padding + границы + иконку сортировки
            const MIN_W = 120;    // минимальная ширина колонки
            const MAX_W = 900;    // ограничение, чтобы колонка не стала гигантской

            ths.forEach((th, colIndex) => {
                const thInner = th.querySelector(".th-inner");
                const col = cols[colIndex];
                if (!thInner || !col) return;

                // включаем перенос
                th.classList.add("two-lines");

                // line-height для расчёта 2 строк
                const cs = getComputedStyle(thInner);
                const lh = parseFloat(cs.lineHeight) || 20;
                const maxH = lh * 2 + 0.5;

                // нижняя граница: ширина самого длинного слова (иначе слово придётся ломать)
                const headerText = this.normalizeText(
                    thInner.childNodes[0]?.textContent || thInner.textContent
                );
                const words = headerText.split(" ").filter(Boolean);
                const longestWord = words.reduce((a, w) => (w.length > a.length ? w : a), "");

                // измерение ширины слова через canvas
                const canvas = this._twCanvas || (this._twCanvas = document.createElement("canvas"));
                const ctx = canvas.getContext("2d");
                ctx.font = cs.font;
                const longestWordW = ctx.measureText(longestWord).width;

                let lo = Math.max(MIN_W, Math.ceil(longestWordW + EXTRA));
                let hi = Math.min(MAX_W, Math.max(lo, 400)); // стартовая верхняя граница

                const prevWidth = thInner.style.width;
                thInner.style.display = "block";

                const fits = (w) => {
                    // задаём ширину ТЕКСТОВОЙ части (без запаса)
                    thInner.style.width = `${Math.max(0, w - EXTRA)}px`;
                    return thInner.getBoundingClientRect().height <= maxH;
                };

                // расширяем hi, пока не уместится в 2 строки (или не упремся в MAX_W)
                while (!fits(hi) && hi < MAX_W) {
                    hi = Math.min(MAX_W, hi + 80);
                }

                // если даже MAX_W не помог — значит без 3+ строк никак (очень длинный заголовок)
                // оставим MAX_W
                if (!fits(hi)) {
                    col.style.width = `${hi}px`;
                    thInner.style.width = prevWidth;
                    return;
                }

                // бинарный поиск минимальной ширины, при которой <= 2 строки
                for (let i = 0; i < 12; i++) {
                    const mid = Math.floor((lo + hi) / 2);
                    if (fits(mid)) hi = mid;
                    else lo = mid + 1;
                }

                col.style.width = `${hi}px`;
                thInner.style.width = prevWidth;
            });
        },*/
        /*applyTwoLinesBalancedWidth() {
            const table = this.$refs.dataTable;
            if (!table) return;

            const theadRow = table.tHead?.rows?.[0];
            const tbodyRows = Array.from(table.tBodies?.[0]?.rows || []);
            const cols = Array.from(table.querySelectorAll("colgroup col"));
            if (!theadRow || !cols.length) return;

            const ths = Array.from(theadRow.cells);

            // canvas for fast measuring
            const canvas =
                this._twCanvas || (this._twCanvas = document.createElement("canvas"));
            const ctx = canvas.getContext("2d");
            const measure = (text, font) => {
                ctx.font = font;
                return ctx.measureText(text).width;
            };

            // настройки
            const SAMPLE_ROWS = 120;  // чтобы не обходить тысячи строк
            const THRESHOLD = 10;     // заголовок "заметно" длиннее значений
            const EXTRA = 30;         // padding/границы + небольшой запас
            const MIN_W = 120;
            const MAX_W = 360;        // главный ограничитель "слишком широко"

            // сброс классов
            ths.forEach(th => th.classList.remove("two-lines"));

            ths.forEach((th, colIndex) => {
                const col = cols[colIndex];
                if (!col) return;

                const thInner = th.querySelector(".th-inner") || th;

                // header text (без иконок)
                const headerText = this.normalizeText(
                    thInner.childNodes[0]?.textContent || thInner.textContent
                );
                if (!headerText) return;

                const thCS = getComputedStyle(thInner);
                const font = thCS.font;

                // ширина заголовка в одну строку
                const headerW = measure(headerText, font);

                // ширина иконок сортировки
                const iconsEl = thInner.querySelector(".sort-icons");
                const iconsW = iconsEl ? iconsEl.getBoundingClientRect().width : 0;

                // max ширина значений по выборке
                let maxCellW = 0;
                const limit = Math.min(tbodyRows.length, SAMPLE_ROWS);
                for (let i = 0; i < limit; i++) {
                    const td = tbodyRows[i].cells[colIndex];
                    if (!td) continue;
                    const cellText = this.normalizeText(td.textContent);
                    if (!cellText) continue;
                    maxCellW = Math.max(maxCellW, measure(cellText, font));
                }

                // условие "только если заголовок длиннее содержимого"
                if (!(headerW > maxCellW + THRESHOLD)) return;

                th.classList.add("two-lines");

                // Важное: минимальная ширина должна позволять показать самое длинное значение
                const minByValues = maxCellW + EXTRA;

                // "равная пропорция на 2 строки": примерно половина заголовка на строку
                const desiredByHeader = headerW / 2 + iconsW + EXTRA;

                // Если есть очень длинное слово без пробелов, нельзя сделать уже него
                const longestWord = headerText.split(" ").reduce((a, w) => (w.length > a.length ? w : a), "");
                const minByLongestWord = measure(longestWord, font) + iconsW + EXTRA;

                // итог
                let target = Math.max(minByValues, desiredByHeader, minByLongestWord, MIN_W);
                target = Math.min(target, MAX_W);

                // ставим на <col>
                col.style.width = `${Math.ceil(target)}px`;
            });
        },
        applyTwoLinesOnlyIfHeaderLonger() {
            const table = this.$refs.dataTable;
            if (!table) return;

            const theadRow = table.tHead?.rows?.[0];
            const tbodyRows = Array.from(table.tBodies?.[0]?.rows || []);
            const cols = Array.from(table.querySelectorAll("colgroup col"));

            if (!theadRow || !cols.length) return;

            const ths = Array.from(theadRow.cells);

            // canvas for text measure
            const canvas = this._twCanvas || (this._twCanvas = document.createElement("canvas"));
            const ctx = canvas.getContext("2d");

            const textWidth = (text, font) => {
                ctx.font = font;
                return ctx.measureText(text).width;
            };

            // настройки
            const THRESHOLD = 10;  // погрешность, чтобы не дёргалось
            const EXTRA = 30;      // запас под padding/границы/иконку сортировки
            const MIN_W = 120;
            const MAX_W = 900;

            // сброс (если хотите сохранять прошлые width у col — можно не трогать)
            ths.forEach(th => th.classList.remove("two-lines"));

            ths.forEach((th, colIndex) => {
                const thInner = th.querySelector(".th-inner") || th;
                const col = cols[colIndex];
                if (!col) return;

                // 1) заголовок (без иконок)
                const headerText = this.normalizeText(
                    thInner.childNodes[0]?.textContent || thInner.textContent
                );
                if (!headerText) return;

                const thCS = getComputedStyle(thInner);
                const font = thCS.font;

                const headerW = textWidth(headerText, font);

                // 2) максимальная ширина значений в колонке
                let maxCellW = 0;
                for (const tr of tbodyRows) {
                    const td = tr.cells[colIndex];
                    if (!td) continue;

                    const cellText = this.normalizeText(td.textContent);
                    if (!cellText) continue;

                    // можно взять font у td, но обычно одинаково
                    maxCellW = Math.max(maxCellW, textWidth(cellText, font));
                }

                // 3) применяем ТОЛЬКО если заголовок реально "длиннее содержимого"
                const needTwoLines = headerW > (maxCellW + THRESHOLD);
                if (!needTwoLines) return;

                th.classList.add("two-lines");

                // 4) подбираем минимальную ширину колонки, чтобы заголовок стал <= 2 строк
                const lineHeight = parseFloat(thCS.lineHeight) || 20;
                const maxH = lineHeight * 2 + 0.5;

                // нижняя граница: ширина самого длинного слова (иначе пришлось бы ломать слово)
                const words = headerText.split(" ").filter(Boolean);
                const longestWord = words.reduce((a, w) => (w.length > a.length ? w : a), "");
                const longestWordW = textWidth(longestWord, font);

                let lo = Math.max(MIN_W, Math.ceil(longestWordW + EXTRA));
                let hi = Math.min(MAX_W, Math.max(lo, Math.ceil(maxCellW + EXTRA), 400));

                const prevInlineWidth = thInner.style.width;
                thInner.style.display = "block";

                const fits = (w) => {
                    // ширина под текст внутри ячейки
                    thInner.style.width = `${Math.max(0, w - EXTRA)}px`;
                    return thInner.getBoundingClientRect().height <= maxH;
                };

                while (!fits(hi) && hi < MAX_W) hi = Math.min(MAX_W, hi + 80);

                // если даже на MAX_W не уместилось — значит иначе никак (очень длинный текст)
                // оставим MAX_W
                if (!fits(hi)) {
                    col.style.width = `${hi}px`;
                    thInner.style.width = prevInlineWidth;
                    return;
                }

                for (let i = 0; i < 12; i++) {
                    const mid = Math.floor((lo + hi) / 2);
                    if (fits(mid)) hi = mid;
                    else lo = mid + 1;
                }

                col.style.width = `${hi}px`;
                thInner.style.width = prevInlineWidth;
            });
        },
        applyTwoLinesAndFitHeaderTo2Lines() {
            const table = this.$refs.dataTable;
            if (!table) return;

            const theadRow = table.tHead?.rows?.[0];
            const tbodyRows = Array.from(table.tBodies?.[0]?.rows || []);
            const cols = Array.from(table.querySelectorAll("colgroup col"));

            if (!theadRow || !cols.length) return;

            const ths = Array.from(theadRow.cells);

            // настройки
            const EXTRA_PX = 28;     // запас на padding/границы/иконки сортировки
            const MIN_PX = 90;       // минимальная ширина колонки
            const MAX_PX = 700;      // максимальная (защита от раздувания)

            // canvas для измерения ширины строк текста
            const canvas = this._twCanvas || (this._twCanvas = document.createElement("canvas"));
            const ctx = canvas.getContext("2d");

            const textWidth = (text, font) => {
                ctx.font = font;
                return ctx.measureText(text).width;
            };

            // сброс классов
            ths.forEach(th => th.classList.remove("two-lines"));

            ths.forEach((th, colIndex) => {
                const thInner = th.querySelector(".th-inner") || th;
                const col = cols[colIndex];
                if (!col) return;

                // 1) текст заголовка без иконок сортировки
                const headerText = this.normalizeText(
                    thInner.childNodes[0]?.textContent || thInner.textContent
                );
                if (!headerText) return;

                const font = getComputedStyle(thInner).font;
                const headerW = textWidth(headerText, font);

                // 2) максимальная ширина значений в колонке
                let maxCellW = 0;
                for (const tr of tbodyRows) {
                    const td = tr.cells[colIndex];
                    if (!td) continue;
                    const cellText = this.normalizeText(td.textContent);
                    if (!cellText) continue;
                    maxCellW = Math.max(maxCellW, textWidth(cellText, font));
                }

                // 3) решаем, нужен ли перенос/подбор ширины
                const needTwoLines = headerW > (maxCellW + 10);
                if (!needTwoLines) return;

                th.classList.add("two-lines");

                // 4) Подбираем минимальную ширину, при которой заголовок <= 2 строк
                //    Будем временно задавать ширину thInner и мерить высоту
                const cs = getComputedStyle(thInner);
                const lineHeight = parseFloat(cs.lineHeight) || 20;
                const maxHeight = lineHeight * 2 + 0.5;

                const prevWidth = thInner.style.width;
                const prevDisplay = thInner.style.display;

                thInner.style.display = "block";

                // нижняя граница: не меньше самого длинного СЛОВА (иначе придётся ломать слово, что запрещено)
                const longestWord = headerText.split(" ").reduce((a, w) => (w.length > a.length ? w : a), "");
                const longestWordW = textWidth(longestWord, font);
                let lo = Math.max(MIN_PX, Math.ceil(longestWordW + EXTRA_PX));
                let hi = Math.min(MAX_PX, Math.ceil(Math.max(headerW + EXTRA_PX, lo)));

                // если даже при hi не влезает в 2 строки (редко, но бывает из-за стилей), расширим hi
                const fitsAt = (w) => {
                    thInner.style.width = `${w - EXTRA_PX}px`; // ширина под текст, минус запас
                    return thInner.getBoundingClientRect().height <= maxHeight;
                };

                while (!fitsAt(hi) && hi < MAX_PX) {
                    hi = Math.min(MAX_PX, hi + 50);
                }

                // бинарный поиск
                for (let i = 0; i < 12; i++) {
                    const mid = Math.floor((lo + hi) / 2);
                    if (fitsAt(mid)) hi = mid;
                    else lo = mid + 1;
                }

                // ставим ширину на <col>
                col.style.width = `${hi}px`;

                // возвращаем инлайн-стили thInner
                thInner.style.width = prevWidth;
                thInner.style.display = prevDisplay;
            });
        },*/
        applyTwoLinesBalancedWidthFullScan() {
            const table = this.$refs.dataTable;
            if (!table) return;

            const theadRow = table.tHead?.rows?.[0];
            const tbody = table.tBodies?.[0];
            const cols = Array.from(table.querySelectorAll("colgroup col"));
            if (!theadRow || !tbody || !cols.length) return;

            const ths = Array.from(theadRow.cells);

            // canvas for text measure
            const canvas =
                this._twCanvas || (this._twCanvas = document.createElement("canvas"));
            const ctx = canvas.getContext("2d");
            const measure = (text, font) => {
                ctx.font = font;
                return ctx.measureText(text).width;
            };

            // настройки
            const THRESHOLD = 10; // чтобы не включать two-lines на грани
            const EXTRA = 30;     // запас: padding/границы
            const MIN_W = 120;
            const MAX_W = 380;    // ограничитель "слишком широко" (подберите под UI)

            // сброс классов
            ths.forEach(th => th.classList.remove("two-lines"));

            // полный проход по строкам один раз на колонку (точно, но O(rows*cols))
            const rows = Array.from(tbody.rows);

            ths.forEach((th, colIndex) => {
                const col = cols[colIndex-1];
                if (!col) return;

                const thInner = th.querySelector(".th-inner") || th;

                const headerText = this.normalizeText(
                    thInner.childNodes[0]?.textContent || thInner.textContent
                );
                if (!headerText) return;

                const thCS = getComputedStyle(thInner);
                const font = thCS.font;

                const headerW = measure(headerText, font);

                // ширина иконок сортировки
                const iconsEl = thInner.querySelector(".sort-icons");
                const iconsW = iconsEl ? iconsEl.getBoundingClientRect().width : 0;


                // max ширина значения в колонке (полный перебор)
                let maxCellW = 0;
                for (const tr of rows) {
                    const td = tr.cells[colIndex];
                    if (!td) continue;
                    const cellText = this.normalizeText(td.textContent);
                    if (!cellText) continue;
                    maxCellW = Math.max(maxCellW, measure(cellText, font));
                }

                // только если заголовок длиннее содержимого
                if (!(headerW > maxCellW + THRESHOLD)) return;

                th.classList.add("two-lines");

                // минимальная ширина: не хуже, чем значения
                const minByValues = maxCellW + EXTRA;

                // цель "две строки примерно поровну"
                const desiredByHeader = headerW / 2 + iconsW + EXTRA;

                // защита от очень длинного слова без пробелов
                const longestWord = headerText
                    .split(" ")
                    .filter(Boolean)
                    .reduce((a, w) => (w.length > a.length ? w : a), "");
                const minByLongestWord = measure(longestWord, font) + iconsW + EXTRA;


                // итоговая ширина
                let target = Math.max(minByValues, desiredByHeader, minByLongestWord, MIN_W);
                target = Math.min(target, MAX_W);

                col.style.width = `${Math.ceil(target)}px`;
            });
        },
        applyTwoLinesAndEnsure2Rows() {
            const table = this.$refs.dataTable;
            if (!table) return;

            const theadRow = table.tHead?.rows?.[0];
            const tbodyRows = Array.from(table.tBodies?.[0]?.rows || []);
            const cols = Array.from(table.querySelectorAll("colgroup col"));

            if (!theadRow || !cols.length) return;

            const ths = Array.from(theadRow.cells);

            // canvas for measuring text (fast)
            const canvas = this._twCanvas || (this._twCanvas = document.createElement("canvas"));
            const ctx = canvas.getContext("2d");
            const measure = (text, font) => {
                ctx.font = font;
                return ctx.measureText(text).width;
            };

            // настройки
            const THRESHOLD = 10;   // заголовок должен быть заметно шире значений
            const MIN_W = 120;      // минимальная ширина колонки
            const MAX_W = 1200;     // защита от бесконечного роста

            // сброс классов (по желанию)
            ths.forEach(th => th.classList.remove("two-lines"));

            ths.forEach((th, colIndex) => {
                const col = cols[colIndex];
                if (!col) return;

                const thInner = th.querySelector(".th-inner") || th;

                // Текст заголовка без "хвоста" с иконками
                // В вашем DOM это реально первый текстовый узел внутри thInner
                const headerText = this.normalizeText(thInner.childNodes[0]?.textContent || thInner.textContent);
                if (!headerText) return;

                const thCS = getComputedStyle(thInner);
                const font = thCS.font;

                // 1) ширина заголовка "в одну строку" (для сравнения с контентом)
                const headerOneLineW = measure(headerText, font);

                // 2) максимальная ширина значений в колонке
                let maxCellW = 0;
                for (const tr of tbodyRows) {
                    const td = tr.cells[colIndex];
                    if (!td) continue;

                    const cellText = this.normalizeText(td.textContent);
                    if (!cellText) continue;

                    // (можно мерить font td, но у вас визуально одинаково)
                    maxCellW = Math.max(maxCellW, measure(cellText, font));
                }

                // 3) условие: работаем ТОЛЬКО если заголовок длиннее содержимого
                if (!(headerOneLineW > maxCellW + THRESHOLD)) return;

                th.classList.add("two-lines");

                // 4) учитываем ширину иконок сортировки
                const iconsEl = thInner.querySelector(".sort-icons");
                const iconsW = iconsEl ? iconsEl.getBoundingClientRect().width : 0;

                // 5) считаем line-height и высоту 2 строк
                const lineHeight = parseFloat(thCS.lineHeight) || 20;
                const maxHeaderHeight = lineHeight * 2 + 0.5;

                // 6) минимальная ширина не меньше самого длинного слова (иначе пришлось бы ломать слово)
                const words = headerText.split(" ").filter(Boolean);
                const longestWord = words.reduce((a, w) => (w.length > a.length ? w : a), "");
                const longestWordW = measure(longestWord, font);

                // 7) Бинарный поиск минимальной ширины колонки, при которой заголовок <= 2 строки
                // стартовые границы:
                // lo: самое длинное слово + padding + иконки
                // hi: максимум из (ширина по контенту) и (текущая ширина col) и (разумное число)
                const currentColW = Math.max(0, col.getBoundingClientRect().width); // текущая фактическая
                let lo = Math.max(MIN_W, Math.ceil(longestWordW + iconsW + 40)); // 40 как запас на padding/границы
                let hi = Math.min(MAX_W, Math.max(lo, Math.ceil(maxCellW + iconsW + 60), currentColW, 400));

                const prevInlineWidth = thInner.style.width;
                thInner.style.display = "block";

                const fits = (colW) => {
                    // задаём ширину для text-части: ширина колонки минус иконки/запасы
                    const textW = Math.max(0, colW - iconsW - 40);
                    thInner.style.width = `${textW}px`;
                    return thInner.getBoundingClientRect().height <= maxHeaderHeight;
                };

                // если на hi не влезает — увеличиваем hi
                while (!fits(hi) && hi < MAX_W) hi = Math.min(MAX_W, hi + 100);

                // если даже MAX_W не помог — оставляем MAX_W (иначе без обрезания никак)
                if (!fits(hi)) {
                    col.style.width = `${hi}px`;
                    thInner.style.width = prevInlineWidth;
                    return;
                }

                // бинарный поиск
                for (let i = 0; i < 12; i++) {
                    const mid = Math.floor((lo + hi) / 2);
                    if (fits(mid)) hi = mid;
                    else lo = mid + 1;
                }

                // ВАЖНО: мы не уменьшаем колонку ниже текущей,
                // мы только увеличиваем, если надо для 2 строк.
                const finalW = Math.max(currentColW || 0, hi);
                col.style.width = `${finalW}px`;

                thInner.style.width = prevInlineWidth;
            });
        },
        getTextWidth(text, font) {
            const canvas =
                this._twCanvas || (this._twCanvas = document.createElement("canvas"));
            const ctx = canvas.getContext("2d");
            ctx.font = font;
            return ctx.measureText(text).width;
        },
        applyTwoLineHeadersAndColWidths() {
            const table = this.$refs.dataTable;
            if (!table) return;

            const theadRow = table.tHead?.rows?.[0];
            const tbodyRows = Array.from(table.tBodies?.[0]?.rows || []);
            const colgroup = table.querySelector("colgroup");
            const cols = colgroup ? Array.from(colgroup.querySelectorAll("col")) : [];

            if (!theadRow) return;

            const ths = Array.from(theadRow.cells);

            // настройки (можно вынести в data/props)
            const EXTRA_PX = 24;          // запас под padding/границы/иконки
            const MIN_COL_PX = 90;        // минимальная разумная ширина
            const MAX_COL_PX = 320;       // чтобы не раздувать колонку бесконечно
            const THRESHOLD = 10;         // погрешность сравнения

            // сброс классов
            ths.forEach(th => th.classList.remove("two-lines"));

            ths.forEach((th, colIndex) => {
                const thInner = th.querySelector(".th-inner") || th;

                // берём текст заголовка (без иконок)
                const headerText = this.normalizeText(
                    thInner.childNodes[0]?.textContent || thInner.textContent
                );
                if (!headerText) return;

                const cs = getComputedStyle(thInner);
                const font = cs.font;

                const headerWidth = this.getTextWidth(headerText, font);

                // максимальная ширина значений в колонке
                let maxCellWidth = 0;
                for (const tr of tbodyRows) {
                    const td = tr.cells[colIndex];
                    if (!td) continue;
                    const cellText = this.normalizeText(td.textContent);
                    if (!cellText) continue;

                    // можно мерить шрифтом td, но чаще одинаково — оставим font заголовка/таблицы
                    const w = this.getTextWidth(cellText, font);
                    if (w > maxCellWidth) maxCellWidth = w;
                }

                // условие two-lines: заголовок заметно шире любого значения
                const needTwoLines = headerWidth > (maxCellWidth + THRESHOLD);

                if (!needTwoLines) {
                    // при желании можно чистить width у col, но аккуратно,
                    // потому что у вас часть col задана "width:auto"
                    return;
                }

                th.classList.add("two-lines");

                // ---- расчёт целевой ширины колонки ----
                // хотим, чтобы:
                // 1) колонка была чуть шире контента (maxCellWidth + EXTRA)
                // 2) но заголовок помещался максимум в 2 строки
                //
                // приближение: чтобы уложить в 2 строки, ширина строки ~ headerWidth/2
                // добавим нижнюю границу, чтобы не стало слишком узко
                const headerTwoLinesWidth = Math.max(MIN_COL_PX, Math.ceil(headerWidth / 2));

                let target = Math.max(
                    maxCellWidth + EXTRA_PX,
                    headerTwoLinesWidth + EXTRA_PX
                );

                target = Math.min(Math.max(target, MIN_COL_PX), MAX_COL_PX);

                // применяем к <col>, если он есть
                const col = cols[colIndex];
                if (col) {
                    col.style.width = `${target}px`;
                } else {
                    // fallback: на th (менее надёжно)
                    th.style.maxWidth = `${target}px`;
                }
            });
        },
        recalcDensity(data = []) {
            //this.maxTempValue = null;

            if (!this.liquidValue || !this.liquidValue.payload) return;

            if(this.liquidValue.id == 'Добавить свою жидкость'){
                return;
            } else {
                this.liquidCustom = '';
            }


            this.densityValue = null;
            this.densityValueV = null;
            const payload = this.liquidValue.payload;
            const payloadV = this.liquidValue.payloadV;
            // Ожидаем объект вида { "1": "999.89", ... }

            if (Array.isArray(payload)) {
                // если вдруг массив — корректируйте под ваш кейс
                //return;
            }

            // Нормализуем ключи температур и ищем ближайшую к maxTempValue
            const t = Number(this.maxTempValue);
            if (Number.isNaN(t)) return;

            const keys = Object.keys(payload);
            if (!keys.length) return;

            // Если есть точное совпадение
            if (payload.hasOwnProperty(String(t))) {
                this.maxTempValue = t;
                this.densityValue = this.toNumber(payload[String(t)]);
                this.densityValueV = this.toNumber(payloadV[String(t)]);
                return;
            }

            // Ищем ближайшую температуру по модулю разницы
            let bestKey = null;
            let bestDiff = Infinity;
            for (const k of keys) {
                const tk = Number(k);
                if (Number.isNaN(tk)) continue;
                const diff = Math.abs(t - tk);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestKey = k;
                }
            }

            if (bestKey !== null) {
                this.maxTempValue = Number(bestKey);
                this.densityValue = this.toNumber(payload[bestKey]);
                this.densityValueV = this.toNumber(payloadV[bestKey]);
            }
        },

        // Нормализация числового значения (поддержка "999,89")
        toNumber(val) {
            if (typeof val === 'number') return val;
            if (val == null) return null;
            const s = String(val).replace(/\s+/g, '').replace(',', '.');
            const n = Number(s);
            return Number.isFinite(n) ? n : null;
        },
        hasHydroPartial(arr, { caseSensitive = false } = {}) {
            if (!Array.isArray(arr)) return false;

            const needles = caseSensitive
                ? ['Hydro-ME', 'Hydro-FS']
                : ['hydro-me', 'hydro-fs'];

            const toString = (val) => {
                if (val == null) return '';
                if (typeof val === 'string') return val;
                if (typeof val === 'number' || typeof val === 'boolean') return String(val);
                if (typeof val === 'object') {
                    // Порядок полей на ваше усмотрение
                    const candidate =
                        val.id ?? val.type ?? val.name ?? val.title ?? val.code ?? '';
                    return typeof candidate === 'string' ? candidate : String(candidate);
                }
                return '';
            };

            const check = (item) => {
                if (Array.isArray(item)) return item.some(check);

                const raw = toString(item);
                const text = caseSensitive ? raw : raw.toLowerCase();

                return text && needles.some(n => text.includes(n));
            };
            if(this.selectedBackupPumps == '' && arr.some(check)){
                this.selectedBackupPumps = { value: 1,text: 1 };
            }
            return arr.some(check);
        },
        isSortable(index) {
            return this.sortableColumns.includes(index);
        },
        blockUI() {
            this.isUiBlocked = true;
            // Блокируем прокрутку страницы
            document.body.style.overflow = 'hidden';
            // При желании — меняем курсор по всей странице
            document.documentElement.style.cursor = 'progress';
        },
        unblockUI() {
            this.isUiBlocked = false;
            document.body.style.overflow = '';
            document.documentElement.style.cursor = '';
        },
        toggleSort(colIndex) {
            if (this.sort.key !== colIndex) {
                // переключили колонку — начинаем с asc
                this.sort.key = colIndex;
                this.sort.direction = 'asc';
            } else {
                // циклим: asc -> desc -> no-sort -> asc...
                if (this.sort.direction === 'asc') this.sort.direction = 'desc';
                else if (this.sort.direction === 'desc') this.sort.direction = null;
                else this.sort.direction = 'asc';
            }
            this.persistSort();
            this.applySort();
        },
        priceToNumber(val) {
            if (val == null) return NaN;
            const s = String(val).trim();

            // "По запросу" — вниз
            if (/по\s*запросу/i.test(s)) return NaN;

            // Удаляем всё, что не цифра/разделитель, нормализуем запятую
            // Примеры: "66 560 руб.", "66 560 ₽", "66,560 руб."
            const normalized = s
                .replace(/\s+/g, '')          // убрать пробелы и узкие неразрывные
                .replace(/[^\d.,]/g, '')      // оставить только цифры/.,
                .replace(/,(?=\d{3}\b)/g, '') // запятая как разделитель тысяч -> удалить
                .replace(/\.(?=\d{3}\b)/g, '')// точка как разделитель тысяч -> удалить
                .replace(',', '.');           // запятая как десятичный -> точка

            const num = Number(normalized);
            return Number.isFinite(num) ? num : NaN;
        },
        priceToNumberV(val) {
            if (val == null) return NaN;
            const s = String(val).trim();

            // "По запросу" — вниз
            if (/Под\s*заказ/i.test(s)) return NaN;
            if (/В\s*пути/i.test(s)) return NaN;

            // Удаляем всё, что не цифра/разделитель, нормализуем запятую
            // Примеры: "66 560 руб.", "66 560 ₽", "66,560 руб."
            const normalized = s
                .replace(/\s+/g, '')          // убрать пробелы и узкие неразрывные
                .replace(/[^\d.,]/g, '')      // оставить только цифры/.,
                .replace(/,(?=\d{3}\b)/g, '') // запятая как разделитель тысяч -> удалить
                .replace(/\.(?=\d{3}\b)/g, '')// точка как разделитель тысяч -> удалить
                .replace(',', '.');           // запятая как десятичный -> точка

            const num = Number(normalized);
            return Number.isFinite(num) ? num : NaN;
        },
        applySort(analogCustom = false) {
            const rows = Array.isArray(this.dataTableContent) ? [...this.dataTableContent] : [];

            // нет сортировки — как есть
            if(this.activeTab == 'analog' && this.ACT_COL_FREE) {
                this.sortableColumns = [1, 2, 3, 4, 5, 6, 9];
            } else if(this.activeTab == 'analog') {
                this.sortableColumns = [1, 2, 3, 4, 5, 6];
            } else if(this.ACT_COL_FREE) {
                this.sortableColumns = [1, 2, 3, 4, 5, 6];
            } else {
                this.sortableColumns = [1, 2, 3, 4, 5];
            }
            if(analogCustom) {
                this.sort.key = 5;
                this.sort.direction = 'asc';
            }
            if (!this.sort.direction || !this.isSortable(this.sort.key)) {
                this.displayData = rows;
                return;
            }

            const dir = this.sort.direction === 'asc' ? 1 : -1;
            const key = this.sort.key;

            this.displayData = rows.sort((a, b) => {
                let av = a[key];
                let bv = b[key];

                // Компараторы для конкретных столбцов
                if (key === 1) {
                    // Артикул: числовое или лексикографическое
                    const an = Number(String(av).replace(/\s/g, ''));
                    const bn = Number(String(bv).replace(/\s/g, ''));
                    if (!Number.isNaN(an) && !Number.isNaN(bn)) return (an - bn) * dir;
                    return String(av).localeCompare(String(bv), 'ru', { numeric: true }) * dir;
                }

                if (key === 5) {
                    // Мощность: по числу в Вт
                    const aw = this.powerToWatts(av);
                    const bw = this.powerToWatts(bv);

                    // Пустые/NaN отправим вниз
                    const aNa = Number.isNaN(aw);
                    const bNa = Number.isNaN(bw);
                    if (aNa && bNa) return 0;
                    if (aNa) return 1; // a вниз
                    if (bNa) return -1; // b вниз

                    return (aw - bw) * dir;
                }

                if (key === 3) {
                    const ap = this.priceToNumber(av);
                    const bp = this.priceToNumber(bv);

                    // "По запросу" и некорректные — всегда вниз
                    const aNa = Number.isNaN(ap);
                    const bNa = Number.isNaN(bp);
                    if (aNa && bNa) return 0;
                    if (aNa) return 1;    // a вниз
                    if (bNa) return -1;   // b вниз

                    return (ap - bp) * dir;
                }
                if (key === 4) {
                    const an = extractNumberOrNaN(av.COUNT);
                    const bn = extractNumberOrNaN(bv.COUNT);
                    const aIsNum = Number.isFinite(an);
                    const bIsNum = Number.isFinite(bn);

                    // Числа всегда выше текста — без учета dir
                    if (aIsNum !== bIsNum) return aIsNum ? -1 : 1;

                    if (aIsNum && bIsNum) {
                        // Оба — числа: сортируем по числу с учетом dir
                        return (an - bn) * dir;
                    }

                    // Оба — текст: чистим и сортируем по алфавиту
                    const at = textKey(av);
                    const bt = textKey(bv);

                    const aEmpty = at === '';
                    const bEmpty = bt === '';
                    if (aEmpty && bEmpty) return 0;
                    if (aEmpty) return 1;     // пустые — вниз среди текста
                    if (bEmpty) return -1;

                    return at.localeCompare(bt, 'ru', { sensitivity: 'accent', numeric: true }) * dir;
                }

                // дефолтный компаратор (на всякий случай)
                return String(av).localeCompare(String(bv), 'ru', { numeric: true }) * dir;
            });
        },
        powerToWatts(raw) {
            if (raw == null) return NaN;
            const text = String(raw)
                .replace(/<[^>]*>/g, '')
                .trim()
                .replace(/\s+/g, ' ');

            const m = text.match(/(-?\d+(?:[.,]\d+)?)\s*(мвт|мВт|мW|мw|мwт|мегаватт|мв|мВт|мw|mw|мвт|мВт|mv|мвт|мв)?\s*(квт|кВт|kw|кw|кwт|киловатт|кв)?\s*(вт|Вт|w|ватт)?/i);
            const numMatch = text.match(/-?\d+(?:[.,]\d+)?/);
            if (!numMatch) return NaN;

            const val = parseFloat(numMatch[0].replace(',', '.'));
            const lower = text.toLowerCase();

            let mul = 1;
            if (/(мвт|мегават|mw|mwt|мwт)/i.test(text) || lower.includes('мвт') || lower.includes('мвт.')) {
                mul = 1e6;
            } else if (/(квт|кВт|kw|kW)/i.test(text) || lower.includes('квт') || lower.includes('квт.')) {
                mul = 1e3;
            } else if (/(вт|Вт|w|W)/i.test(text)) {
                mul = 1;
            } else {
                mul = 1e3;
            }

            return val * mul;
        },
        persistSort() {
            localStorage.setItem('tableSort', JSON.stringify(this.sort));
        },
        restoreSort() {
            try {
                const saved = JSON.parse(localStorage.getItem('tableSort'));
                if (saved && typeof saved === 'object' && this.isSortable(saved.key)) {
                    this.sort = {
                        key: saved.key,
                        direction: saved.direction ?? 'asc',
                    };
                } else {
                    // Нет сохранённой сортировки — по умолчанию сортируем по Мощности asc
                    this.sort = { key: 5, direction: 'asc' };
                }
            } catch {
                this.sort = { key: 5, direction: 'asc' };
            }
        },
        handleEnter(e) {
            if (e.key === "Enter") {
                this.submitForm()
            }
        },
        validateInput(event) {
            let value = event.target.value;
            value = value.replace(/,/g, '.');
            let cleanedValue = value.replace(/[^-0-9.]/g, '');
            let parts = cleanedValue.split('.');
            if (parts.length > 2) {
                // Если больше одной точки, оставляем только первую
                value = parts[0] + '.' + parts.slice(1).join('').substring(0, 4);
            } else if (parts.length === 2) {
                // Если есть точка, ограничиваем количество цифр после нее
                value = parts[0] + '.' + parts[1].substring(0, 4);
            } else {
                // Если нет точки, просто используем очищенное значение
                value = parts[0];
            }
            if(value < -100){
                value = -100;
            }
            if(value > 100){
                value = 100;
            }
            this.tolerance = value;
            event.target.value = value;
        },
        validateInputDen(event) {
            let value = event.target.value;
            value = value.replace(/,/g, '.');
            let cleanedValue = value.replace(/[^-0-9.]/g, '');
            let parts = cleanedValue.split('.');
            if (parts.length > 2) {
                // Если больше одной точки, оставляем только первую
                value = parts[0] + '.' + parts.slice(1).join('').substring(0, 4);
            } else if (parts.length === 2) {
                // Если есть точка, ограничиваем количество цифр после нее
                value = parts[0] + '.' + parts[1].substring(0, 4);
            } else {
                // Если нет точки, просто используем очищенное значение
                value = parts[0];
            }
            this.densityValue = value;
            event.target.value = value;
        },
        validateInputDenV(event) {
            let value = event.target.value;
            value = value.replace(/,/g, '.');
            let cleanedValue = value.replace(/[^-0-9.]/g, '');
            let parts = cleanedValue.split('.');
            if (parts.length > 2) {
                // Если больше одной точки, оставляем только первую
                value = parts[0] + '.' + parts.slice(1).join('').substring(0, 4);
            } else if (parts.length === 2) {
                // Если есть точка, ограничиваем количество цифр после нее
                value = parts[0] + '.' + parts[1].substring(0, 4);
            } else {
                // Если нет точки, просто используем очищенное значение
                value = parts[0];
            }
            this.densityValueV = value;
            event.target.value = value;
        },
        validateInputMaxTemp(event) {
            let value = event.target.value;
            value = value.replace(/,/g, '.');
            let cleanedValue = value.replace(/[^-0-9.]/g, '');
            let parts = cleanedValue.split('.');
            if (parts.length > 2) {
                // Если больше одной точки, оставляем только первую
                value = parts[0] + '.' + parts.slice(1).join('').substring(0, 4);
            } else if (parts.length === 2) {
                // Если есть точка, ограничиваем количество цифр после нее
                value = parts[0] + '.' + parts[1].substring(0, 4);
            } else {
                // Если нет точки, просто используем очищенное значение
                value = parts[0];
            }
            this.maxTempValue = value;
            event.target.value = value;

            this.checkMaxTempRangeAndBlink();
        },
        checkMaxTempRangeAndBlink() {
            // диапазон должен быть доступен
            if (this.ufNuMinKey == null || this.ufNuMaxKey == null) return;

            // пустое/минус/точка — не считаем числом, чтобы не мигать во время ввода
            const s = String(this.maxTempValue ?? '').trim();
            if (!s || s === '-' || s === '.' || s === '-.') return;

            const num = Number(s);
            if (!Number.isFinite(num)) return;

            const min = Number(this.ufNuMinKey);
            const max = Number(this.ufNuMaxKey);
            if (!Number.isFinite(min) || !Number.isFinite(max)) return;

            const outOfRange = num < min || num > max;

            if (outOfRange) {
                this.isMaxTempOutOfRange = true;

                clearTimeout(this._maxTempOutOfRangeTimer);
                this._maxTempOutOfRangeTimer = setTimeout(() => {
                    this.isMaxTempOutOfRange = false;
                }, 3000);
            }
        },
        validateInputStatPres(event) {
            let value = event.target.value;
            value = value.replace(/,/g, '.');
            let cleanedValue = value.replace(/[^-0-9.]/g, '');
            let parts = cleanedValue.split('.');
            if (parts.length > 2) {
                // Если больше одной точки, оставляем только первую
                value = parts[0] + '.' + parts.slice(1).join('').substring(0, 4);
            } else if (parts.length === 2) {
                // Если есть точка, ограничиваем количество цифр после нее
                value = parts[0] + '.' + parts[1].substring(0, 4);
            } else {
                // Если нет точки, просто используем очищенное значение
                value = parts[0];
            }
            this.staticPressureValue = value;
            event.target.value = value;
        },
        validateInputPresVal(event) {
            let value = event.target.value;
            value = value.replace(/,/g, '.');
            let cleanedValue = value.replace(/[^-0-9.]/g, '');
            let parts = cleanedValue.split('.');
            if (parts.length > 2) {
                // Если больше одной точки, оставляем только первую
                value = parts[0] + '.' + parts.slice(1).join('').substring(0, 4);
            } else if (parts.length === 2) {
                // Если есть точка, ограничиваем количество цифр после нее
                value = parts[0] + '.' + parts[1].substring(0, 4);
            } else {
                // Если нет точки, просто используем очищенное значение
                value = parts[0];
            }
            this.pressureValue = value;
            event.target.value = value;
        },
        validateInputPresSVal(event) {
            let value = event.target.value;
            value = value.replace(/,/g, '.');
            let cleanedValue = value.replace(/[^-0-9.]/g, '');
            let parts = cleanedValue.split('.');
            if (parts.length > 2) {
                // Если больше одной точки, оставляем только первую
                value = parts[0] + '.' + parts.slice(1).join('').substring(0, 4);
            } else if (parts.length === 2) {
                // Если есть точка, ограничиваем количество цифр после нее
                value = parts[0] + '.' + parts[1].substring(0, 4);
            } else {
                // Если нет точки, просто используем очищенное значение
                value = parts[0];
            }
            this.staticPressureValue = value;
            event.target.value = value;
        },
        validateInputFlowVal(event) {
            let value = event.target.value;
            value = value.replace(/,/g, '.');
            let cleanedValue = value.replace(/[^-0-9.]/g, '');
            let parts = cleanedValue.split('.');
            if (parts.length > 2) {
                // Если больше одной точки, оставляем только первую
                value = parts[0] + '.' + parts.slice(1).join('').substring(0, 4);
            } else if (parts.length === 2) {
                // Если есть точка, ограничиваем количество цифр после нее
                value = parts[0] + '.' + parts[1].substring(0, 4);
            } else {
                // Если нет точки, просто используем очищенное значение
                value = parts[0];
            }
            this.flowValue = value;
            event.target.value = value;
        },
        filterSmartInfo(typeFilter = '', nameNam = []) {
            this.customTypeFilter = typeFilter;
            if (typeFilter == 'selectedApplication') {
                this.bodyMaterial = "";
                this.selectedDischargeSizes = [];
                this.selectedEquipmentTypes = [];
                this.selectedPhaseCount = "";
                this.selectedPoleCount = "";
                this.selectedPowers = [];
                this.selectedSizeTypes = [];
                this.selectedServiceFactor = [];
                this.selectedSuctionSizes = [];
                this.selectedTypeMontag = [];
                this.selectedTimeWork = [];
                this.selectedVsPopVikl = [];
                this.selectedVsPopViklQ = [];
                this.wheelMaterial = "";
                this.maxWorkingPressure = "";
                this.maxWorkingPressureFree = "";
                //this.maxWorkingPressureFreeFrom = "";
                //this.maxWorkingPressureFreeTo = "";
                this.wheelType = "";
            }
            const filters = {
                selectedEquipmentTypes: 'equipmentTypes',
                selectedSizeTypes: 'sizeTypes',
                selectedServiceFactor: 'serviceFactor',
                bodyMaterial: 'bodyMaterialCount',
                wheelMaterial: 'wheelMaterialCount',
                wheelType: 'wheelTypeOptions',
                maxWorkingPressure: 'wheelTypeCount',
                maxWorkingPressureFree: 'wheelTypeCountFree',
                selectedDischargeSizes: 'dischargeSizes',
                selectedSuctionSizes: 'suctionSizes',
                selectedTypeMontag: 'typeMontag',
                selectedTimeWork: 'timeWork',
                selectedVsPopVikl: 'vsPopVikl',
                selectedVsPopViklQ: 'vsPopViklQ',
                selectedPowers: 'powers',
                selectedPhaseCount: 'phaseCounts',
                selectedPoleCount: 'poleCounts'
            };
            const payload = {
                applications: this.selectedApplication,
                bodyMaterialCount: this.bodyMaterial,
                dischargeSizes: this.selectedDischargeSizes,
                equipmentTypes: this.selectedEquipmentTypes,
                phaseCounts: this.selectedPhaseCount,
                poleCounts: this.selectedPoleCount,
                powers: this.selectedPowers,
                sizeTypes: this.selectedSizeTypes,
                serviceFactor: this.selectedServiceFactor,
                suctionSizes: this.selectedSuctionSizes,
                typeMontag: this.selectedTypeMontag,
                timeWork: this.selectedTimeWork,
                vsPopVikl: this.selectedVsPopVikl,
                vsPopViklQ: this.selectedVsPopViklQ,
                wheelMaterialCount: this.wheelMaterial,
                wheelTypeCount: this.maxWorkingPressure,
                wheelTypeCountFree: this.maxWorkingPressureFree,
                wheelTypeOptions: this.wheelType,
                pressureValue: this.pressureValue,
                flowValue: this.flowValue,
                nameNam: nameNam
            };

            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            if (custom) {
                payload.custom = custom;
            }
            fetch('/product_selection/smart_filter.php', { // Замените на Ваш URL для отправки данных
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(response => response.json())
                .then(data => {
                    for (const [filterKey, dataKey] of Object.entries(filters)) {
                        if (typeFilter !== filterKey) {
                            // Проверяем, нужно ли обновить значение:
                            if (!this[dataKey] ||
                                (data[dataKey] && data[dataKey].length > this[dataKey].length) ||
                                (data[dataKey] && data[dataKey].length < this[dataKey].length)) {
                                if(dataKey == 'wheelTypeOptions') {
                                }
                                this[dataKey] = data[dataKey];
                            }
                        } else {
                            if(dataKey == 'wheelTypeOptions') {
                            }
                            if ((data[dataKey] && data[dataKey].length > this[dataKey].length)) {
                                this[dataKey] = data[dataKey];
                            }
                        }
                    }
                })
                .catch(error => {
                    console.error('Ошибка при отправке данных:', error);
                })
                .finally(() => {
                    this.isLoading = false; // Выключаем прелоадер
                });
        },
        openModal(imageUrl) {
            this.currentImage = imageUrl;
            this.isModalOpen = true;
        },
        closeModal() {
            this.isModalOpen = false;
            this.currentImage = '';
        },
        getImageUrl(imgHtml) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = imgHtml;
            return tempDiv.querySelector('img').src; // Извлекаем URL изображения из HTML
        },
        fetchNames() {

            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/analog.php?application_id=${JSON.stringify(this.selectedApplication)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL для получения данных
                .then(response => response.json())
                .then(data => {
                    this.allNames = Object.values(data); // Предполагается, что сервер возвращает массив
                    this.filterNames();
                    //this.filteredNames = this.allNames; // Обновляем типы оборудования при загрузке
                })
                .catch(error => {
                    console.error('Ошибка при загрузке данных:', error);
                });
        },
        filterNames() {
            const selectedManufacturerId = this.selectedManufacturer.id; // Получаем id выбранного производителя
            this.showAnalog = false;
            if (selectedManufacturerId) {
                this.filteredNames = this.allNames.filter(name => {
                    let parsedArray1 = parseStringToArray(name.type);
                    let result1 = compareKeys(parsedArray1, this.analogInfoBlock);
                    if (this.analogInfoBlock[name.type]) {
                        this.showAnalog = true;
                    }
                    return name.proz === selectedManufacturerId; // Сравниваем поле proz с id производителя
                });
            } else {
                this.showAnalog = false;
                this.filteredNames = this.allNames;
            }
            this.selectedName = [];
            this.resetCustomGrafTable();
        },
        filterNamesDelete() {
            this.filteredNames = this.allNames;
            this.selectedName = [];
            this.resetCustomGrafTable();
        },
        getActiveTabContent() {
            const activeTabObj = this.tabs.find(tab => tab.id === this.activeTab);
            return activeTabObj ? activeTabObj.label : '';
        },
        loadApplications() {

            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/applications.php?custom=${JSON.stringify(custom)}`) // Замените на Ваш URL для получения данных
                .then(response => response.json())
                .then(data => {
                    this.applications = Object.values(data); // Предполагается, что сервер возвращает массив
                    if (this.defaultParams.applications.length == 0) {
                        this.defaultParams.applications = this.applications;
                    }
                    this.updateEquipmentTypes(true); // Обновляем типы оборудования при загрузке
                })
                .catch(error => {
                    console.error('Ошибка при загрузке данных:', error);
                });
        },
        loadLiquidId() {
            fetch('/product_selection_new/liquid.php') // Замените на Ваш URL для получения данных
                .then(response => response.json())
                .then(data => {
                    this.liquid = Object.values(data); // Предполагается, что сервер возвращает массив
                    this.liquid = Object.keys(data).map(key => ({
                        id: key,          // track-by
                        name: key,        // label
                        payload: data[key]['UF_DENSITY'], // чтобы потом легко получить вложенные данные
                        payloadV: data[key]['UF_NU'], // чтобы потом легко получить вложенные данные
                    })); // Предполагается, что сервер возвращает массив
                    if (this.defaultParams.liquid.length == 0) {
                        this.defaultParams.liquid = this.liquid;
                    }

                    const def = this.liquid.find(o => o.id === this.liquidValueDefault);
                    if (def) {
                        this.liquidValue = def;
                    } else if (this.liquid.length) {
                        this.liquidValue = this.liquid[0];
                    }
                    this.liquidCustomCon = data;
                    this.concentrationValueID = getUFConcOptions(data, this.liquidValue.id);
                    if (this.defaultParams.concentrationValueID.length == 0) {
                        this.defaultParams.concentrationValueID = this.concentrationValueID;
                    }
                    this.concentrationValue = {
                        "id": 1,
                        "name": 100
                    };
                    // Пересчёт плотности после установки дефолта
                    this.recalcDensity();
                })
                .catch(error => {
                    console.error('Ошибка при загрузке данных:', error);
                });
        },
        selectedKey () {

        },
        showPopupNo() {
            return new Promise((resolve) => {
                // Логика для отображения popup
                // Например, открытие модального окна

                // Предположим, у Вас есть метод для открытия popup
                this.showPopupErrorReq = true;

                // Добавьте обработчик события для закрытия popup
                // Например, через кнопку "Закрыть" в Вашем popup
                this.savePopupParamsErrorReq = () => {
                    // Здесь вызываем resolve, когда popup закрывается
                    resolve();
                    // Удаляем обработчик, чтобы избежать утечек памяти
                    this.showPopupErrorReq = null;
                };
            });
        },
        submitForm() {
            if (parseFloat(this.staticPressureValue) < 0
                || parseFloat(this.pressureValue) < 0
                || parseFloat(this.flowValue) < 0
            ) {
                this.showPopupErrorDuble = true;
                return false;
            }
            if (parseFloat(this.staticPressureValue) > parseFloat(this.pressureValue)) {
                this.showPopupError = true;
                return false;
            }
            if (this.activeTab == 'analog' && this.selectedName == '') {
                this.showPopupAnalError = true;
                return false;
            }
            if (this.activeTab == 'quick' && (this.selectedApplication == ''
                    && this.flowValue == ''
                    && this.pressureValue == ''
                    && this.staticPressureValue == ''
                )
            ) {
                if(this.downLoadArtFull == ''){
                this.showPopupAnalDataError = true;
                return false;
            }
            }
            if (this.activeTab == 'search' && (this.selectedApplication == ''
                    && this.articleInput == ''
                    && this.flowValue == ''
                    && this.pressureValue == ''
                    && this.staticPressureValue == ''
                )
            ) {
                if(this.downLoadArtFull == ''){
                this.showPopupAnalDataError = true;
                return false;
            }
            }
            if (this.activeTab == 'extended' && (this.selectedApplication == ''
                    && this.flowValue == ''
                    && this.pressureValue == ''
                    && this.staticPressureValue == ''
                    && this.selectedEquipmentTypes == ''
                    && this.selectedSizeTypes == ''
                    && this.selectedServiceFactor == ''
                    && this.bodyMaterial == ''
                    && this.wheelMaterial == ''
                    && this.wheelType == ''
                    && this.maxWorkingPressure == ''
                    && this.maxWorkingPressureFree == ''
                    && this.selectedDischargeSizes == ''
                    && this.selectedSuctionSizes == ''
                    && this.selectedTypeMontag == ''
                    && this.selectedPowers == ''
                    && this.selectedVsPopVikl == ''
                    && this.selectedVsPopViklQ == ''
                    && this.selectedTimeWork == ''
                    && this.selectedPhaseCount == ''
                    && this.selectedPoleCount == ''
                )
            ) {
                if(this.downLoadArtFull == ''){
                this.showPopupAnalDataError = true;
                return false;
            }
            }
            this.anal = '';
            if (window.innerWidth <= 568) {
                const rightPanel = document.querySelector('.app-panel-preview');
                if (rightPanel) {
                    const rect = rightPanel.getBoundingClientRect();
                    const offset = rect.top + window.scrollY - 62; // Смещение на 62px выше
                    window.scrollTo({
                        top: offset,
                        behavior: 'smooth' // Плавный скролл
                    });
                }
            }

            this.isLoading = true; // Включаем прелоадер
            const payload = {
                selectedManufacturer: this.selectedManufacturer,
                application: this.selectedApplication,
                equipmentTypes: this.selectedEquipmentTypes,
                flowValue: this.flowValue, // Значение расхода
                analogDl: (this.showAnalogPopMD && this.showAnalog && this.selectedName && this.selectedName.id ? this.analog.dl : ''), // Единица измерения расхода
                analogDlV: this.analog.dlV, // Единица измерения расхода
                analogPvikl: this.analog.pVikl, // Единица измерения расхода
                analogPviklQ: this.analog.pViklQ, // Единица измерения расхода
                analogPw: this.analog.pw, // Единица измерения расхода
                analogT: this.analog.t, // Единица измерения расхода
                selectedName: this.selectedName, // Единица измерения расхода
                analogRpat: this.analog.rpat, // Единица измерения расхода
                flowUnit: this.selectedUnits.flow, // Единица измерения расхода
                pressureValue: this.pressureValue, // Значение напора
                pressureUnit: this.selectedUnits.pressure, // Единица измерения напора
                staticPressureValue: this.staticPressureValue, // Значение статического напора
                staticPressureUnit: this.selectedUnits.staticPressure, // Единица измерения статического напора
                liquidValue: (this.liquidCustom ? this.liquidCustom +(' (указано пользователем)') : (this.liquidValue ? this.liquidValue.id : '')), // Значение жидкости
                maxTempValue: this.maxTempValue, // Значение максимальной температуры
                _maxTempTimeout: null,
                concentrationValue: this.concentrationValue, // Значение концентрации
                concentrationUnit: this.selectedUnits.concentration, // Единица измерения концентрации
                densityValue: this.densityValue, // Значение плотности
                densityValueV: this.densityValueV, // Значение плотности
                densityUnit: this.selectedUnits.density, // Единица измерения плотности
                selectedParallelConnection: this.selectedParallelConnection, // Выбранное параллельное соединение
                selectedBackupPumps: this.selectedBackupPumps, // Выбранные резервные насосы
                frequencyControl: this.frequencyControl, // Отправка состояния чекбокса
                frequencyControlZon: this.frequencyControlZon, // Отправка состояния чекбокса
                frequencyControlZonService: this.frequencyControlZonService, // Отправка состояния чекбокса
                downLoadArtFull: this.downLoadArtFull, // Отправка состояния чекбокса
                count: this.count, // Отправка состояния чекбокса
                page: this.page, // Отправка состояния чекбокса
                tolerance: this.tolerance, // Запас / Допуск Q-H
                addCustomGraph: this.addCustomGraph, // Добавить произвольный график
                customGraph: this.addCustomGraph ? {
                    name: this.customGraph.name,
                    points: this.customGraph.points.map(point => ({
                        q: point.q,
                        h: point.h
                    }))
                } : null, // Отправляем null, если график не добавляется
                hidePrice: this.hidePrice, // Скрыть цену
                hideArticle: this.hideArticle, // Скрыть артикул
                articleInput: this.articleInput,
                selectedDischargeSizes: this.selectedDischargeSizes,
                selectedSuctionSizes: this.selectedSuctionSizes,
                selectedTypeMontag: this.selectedTypeMontag,
                selectedTimeWork: this.selectedTimeWork,
                selectedVsPopVikl: this.selectedVsPopVikl,
                selectedVsPopViklQ: this.selectedVsPopViklQ,
                selectedPowers: this.selectedPowers,
                bodyMaterial: this.bodyMaterial,
                wheelMaterial: this.wheelMaterial,
                //typeMaterial: this.typeMaterial,
                wheelType: this.wheelType,
                maxWorkingPressure: this.maxWorkingPressure,
                maxWorkingPressureFree: this.maxWorkingPressureFree,
                selectedSizeTypes: this.selectedSizeTypes,
                selectedServiceFactor: this.selectedServiceFactor,
                selectedPhaseCount: this.selectedPhaseCount,
                selectedPoleCount: this.selectedPoleCount,
                activeTab: this.activeTab,
                domenInfo: (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0 ? window.location.ancestorOrigins[0] : window.location.origin)
            };
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            if (custom) {
                payload.custom = custom;
            }
            if(this.liquidValue.id != 'Вода'
                && (this.selectedParallelConnection
                && this.selectedParallelConnection.value > 1
                || this.frequencyControl)
            ){
                //this.showPopupErrorReqVS = true;
                //this.isLoading = false;
                //return false;
            }
            //this.isLoadingButtonD = true;
            fetch('/product_selection/submit.php', { // Замените на Ваш URL для отправки данных
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(response => response.json())
                .then(data => {
                    this.rightPanelContent = data.rightPanelContent; // Обновление контента правой панели
                    this.dataTableContent = data.dataTableContent; // Обновление данных таблицы
                    if(0 && data.error == "Invalid CSRF token"){
                        this.showPopupErrorReqVS = false;
                        this.showPopupErrorReqVSsr = true;
                        return false;
                    } else {
                        this.tableHeaders = data.tableHeaders; // Обновление заголовков таблицы
                        this.idIndoAnalId = data.ID_ANALITICS; // Обновление заголовков таблицы
                        this.ACT_COL_FREE = data.ACT_COL_FREE; // Обновление заголовков таблицы
                        if(this.activeTab != 'analog') {
                        this.applySort();
                        } else {
                            this.applySort(1);
                        }
                        if (this.dataTableContent.length > 0 && this.displayData.length > 0) {
                            this.selectRow(this.displayData[0]); // Выбор первого элемента
                        } else if (this.dataTableContent.length < 1 && this.activeTab == 'analog') {
                            this.sendRowData('', 'analog');
                            window.alert = (message) => {
                                $('#PromiseAlert .modal-body p').html(message);
                                this.showPromiseAlert = true;
                                return new Promise(function (resolve, reject) {
                                    this.showPromiseAlert = false;
                                    return resolve(); // Игнорируем клик, если строка уже выбрана
                                });
                            };

                            alert('К сожалению, по указанным параметрам оборудование не найдено. Пожалуйста, попробуйте изменить условия подбора или укажите требуемые параметры в запросе и отправьте его нам.');

                        } else {
                            this.chartData = ''; // Предполагается, что сервер возвращает данные для графика
                            this.photoData = ''; // Предполагается, что сервер возвращает URL фото
                            this.drawingData = ''; // Предполагается, что сервер возвращает URL чертежа
                            this.activeMainTabChert = ''; // Предполагается, что сервер возвращает URL чертежа
                            this.gabChert = ''; // Предполагается, что сервер возвращает URL чертежа
                            this.elSchema = ''; // Предполагается, что сервер возвращает URL чертежа
                            this.schemMon = ''; // Предполагается, что сервер возвращает URL чертежа
                            this.docData = '';
                            this.techData = '';
                            this.techDataBim = '';
                            this.techDataDwg3D = '';
                            this.techDataDwg2D = '';
                            this.techDataGig = '';
                            this.techDataSertSeq = '';
                            this.techDataCatInfo = '';
                            this.techDataSerInfo = '';
                            this.techDataRukInfo = '';

                            window.alert = (message) => {
                                $('#PromiseAlert .modal-body p').html(message);
                                this.showPromiseAlert = true;
                                return new Promise(function (resolve, reject) {
                                    this.showPromiseAlert = false;
                                    return resolve(); // Игнорируем клик, если строка уже выбрана
                                });
                            };

                            alert('К сожалению, по указанным параметрам оборудование не найдено. Пожалуйста, попробуйте изменить условия подбора или укажите требуемые параметры в запросе и отправьте его нам.');
                            return false;
                        }
                        if (this.activeTab == 'extended' || this.activeTab == 'quick') {
                            this.filterSmartInfo(this.customTypeFilter, data.ACTUALY_FILTER);
                        }
                    }
                })
                .catch(error => {
                    console.error('Ошибка при отправке данных:', error);
                })
                .finally(async () => {
                    this.isLoading = false;
                    await this.$nextTick();
                    this.applyTwoLinesBalancedWidthFullScan();
                });
        },
        selectRow(row = '', anal = '') {
            return new Promise((resolve) => {
                if (this.selectedRow === row || (anal == 'analog' && row == '')) {
                    return resolve(); // Игнорируем клик, если строка уже выбрана
                }
                this.selectedRow = this.selectedRow === row ? null : row; // Убираем выделение, если кликнули на уже выбранную строку
                if (this.selectedRow || (anal == 'analog' && row == '')) {
                    // Ожидаем завершения отправки данных
                    this.sendRowData(this.selectedRow, anal).then(() => {
                        resolve(); // Завершаем промис после отправки данных
                    });
                } else {
                    resolve(); // Если строка не выбрана, просто завершаем промис
                }
            });
        },
        sendRowData(row = '', anal = '') {
            return new Promise((resolve, reject) => {
                this.anal = anal;
                this.isLoading = true; // Включаем прелоадер
                if(row != '' || (anal == 'analog' && row == '')) {
                    const payload = {
                        application: this.selectedApplication,
                        equipmentTypes: this.selectedEquipmentTypes,
                        flowValue: this.flowValue, // Значение расхода
                        flowUnit: this.selectedUnits.flow, // Единица измерения расхода
                        pressureValue: this.pressureValue, // Значение напора
                        pressureUnit: this.selectedUnits.pressure, // Единица измерения напора
                        staticPressureValue: this.staticPressureValue, // Значение статического напора
                        staticPressureUnit: this.selectedUnits.staticPressure, // Единица измерения статического напора
                        liquidValue: (this.liquidCustom ? this.liquidCustom +(' (указано пользователем)') : (this.liquidValue ? this.liquidValue.id : '')), // Значение жидкости
                        maxTempValue: this.maxTempValue, // Значение максимальной температуры
                        concentrationValue: this.concentrationValue, // Значение концентрации
                        concentrationUnit: this.selectedUnits.concentration, // Единица измерения концентрации
                        densityValue: this.densityValue, // Значение плотности
                        densityValueV: this.densityValueV, // Значение плотности
                        densityUnit: this.selectedUnits.density, // Единица измерения плотности
                        selectedParallelConnection: this.selectedParallelConnection, // Выбранное параллельное соединение
                        selectedBackupPumps: this.selectedBackupPumps, // Выбранные резервные насосы
                        frequencyControl: this.frequencyControl, // Отправка состояния чекбокса
                        frequencyControlZon: this.frequencyControlZon, // Отправка состояния чекбокса
                        frequencyControlZonService: this.frequencyControlZonService, // Отправка состояния чекбокса
                        downLoadArtFull: this.downLoadArtFull, // Отправка состояния чекбокса
                        count: this.count, // Отправка состояния чекбокса
                        page: this.page, // Отправка состояния чекбокса
                        tolerance: this.tolerance, // Запас / Допуск Q-H
                        addCustomGraph: this.addCustomGraph, // Добавить произвольный график
                        customGraph: this.addCustomGraph ? {
                            name: this.customGraph.name,
                            points: this.customGraph.points.map(point => ({
                                q: point.q,
                                h: point.h
                            }))
                        } : null, // Отправляем null, если график не добавляется
                        hidePrice: this.hidePrice, // Скрыть цену
                        hideArticle: this.hideArticle, // Скрыть артикул
                        articleInput: this.articleInput,
                        selectedDischargeSizes: this.selectedDischargeSizes,
                        selectedSuctionSizes: this.selectedSuctionSizes,
                        selectedTypeMontag: this.selectedTypeMontag,
                        selectedTimeWork: this.selectedTimeWork,
                        selectedVsPopVikl: this.selectedVsPopVikl,
                        selectedVsPopViklQ: this.selectedVsPopViklQ,
                        selectedPowers: this.selectedPowers,
                        bodyMaterial: this.bodyMaterial,
                        wheelMaterial: this.wheelMaterial,
                        //typeMaterial: this.typeMaterial,
                        wheelType: this.wheelType,
                        concentrationValue: this.concentrationValue,
                        maxWorkingPressure: this.maxWorkingPressure,
                        maxWorkingPressureFree: this.maxWorkingPressureFree,
                        selectedSizeTypes: this.selectedSizeTypes,
                        selectedServiceFactor: this.selectedServiceFactor,
                        selectedPhaseCount: this.selectedPhaseCount,
                        selectedPoleCount: this.selectedPoleCount,
                        idIndoAnalId: this.idIndoAnalId,
                        selectedName: this.selectedName, // Единица измерения расхода
                        anal: anal, // Единица измерения расхода
                        selectedCellData: row[0] // Замените someCell на нужное поле из выбранной строки
                    };
                    window.infoDateQ = '';
                    fetch('/product_selection/row_data.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Сетевая ошибка'); // Генерируем ошибку, если ответ не успешен
                            }
                            return response.json();
                        })
                        .then(data => {
                            if(0 && data.error == "Invalid CSRF token"){
                                this.showPopupErrorReqVS = false;
                                this.showPopupErrorReqVSsr = true;
                                return false;
                            } else {
                                let _this = this;
                                if (data.error == "errorShowVS") {
                                    this.showPopupErrorReqVSsrQ = true;
                                    return false;
                                } else {
                                    // Обновляем данные в right-panel
                                    let jsonDecArray = data;
                                    this.textListArt = data.NAME; // Предполагается, что сервер возвращает URL фото
                                    this.showNoAdd = data.showNoAdd; // Предполагается, что сервер возвращает URL фото
                                    this.photoData = data.photo; // Предполагается, что сервер возвращает URL фото
                                    this.drawingData = data.drawing; // Предполагается, что сервер возвращает URL чертежа

                                    this.gabChert = data.gabChert; // Предполагается, что сервер возвращает URL чертежа
                                    this.elSchema = data.elSchema; // Предполагается, что сервер возвращает URL чертежа
                                    this.schemMon = data.schemMon; // Предполагается, что сервер возвращает URL чертежа
                                    this.gbl = data.GBL;
                                    this.pageSixShow = false;
                                    this.pageFiveShow = false;
                                    this.pageForShow = false;
                                    if (typeof this.schemMon !== "undefined" && this.schemMon.length > 0) {
                                        this.activeMainTabChert = 'schemMon';// Предполагается, что сервер возвращает URL чертежа
                                        this.pageSixShow = true;
                                    }
                                    if (typeof this.elSchema !== "undefined" && this.elSchema.length > 0) {
                                        this.activeMainTabChert = 'elSchema';// Предполагается, что сервер возвращает URL чертежа
                                        this.pageFiveShow = true;
                                    }
                                    if (typeof this.gabChert !== "undefined" && this.gabChert.length > 0) {
                                        this.activeMainTabChert = 'gabChert';// Предполагается, что сервер возвращает URL чертежа
                                        this.pageForShow = true;
                                    }
                                    this.docData = data.docData; // Предполагается, что сервер возвращает тех. данные
                                    this.techData = data.techData; // Предполагается, что сервер возвращает тех. данные
                                    this.techDataBim = data.techDataBim; // Предполагается, что сервер возвращает тех. данные
                                    this.techDataDwg3D = data.techDataDwg3D; // Предполагается, что сервер возвращает тех. данные
                                    this.techDataDwg2D = data.techDataDwg2D; // Предполагается, что сервер возвращает тех. данные
                                    this.techDataGig = data.techDataGig; // Предполагается, что сервер возвращает тех. данные
                                    this.techDataSertSeq = data.techDataSertSeq; // Предполагается, что сервер возвращает тех. данные
                                    this.techDataCatInfo = data.techDataCatInfo; // Предполагается, что сервер возвращает тех. данные
                                    this.techDataSerInfo = data.techDataSerInfo; // Предполагается, что сервер возвращает тех. данные
                                    this.techDataRukInfo = data.techDataRukInfo; // Предполагается, что сервер возвращает тех. данные
                                    this.nameNasos = jsonDecArray.NAME_2; // Предполагается, что сервер возвращает тех. данные


                                    //this.pageOneShow = (data.pageOneShow == 'Y' ? true : false);
                                    this.pageTwoShow = true;
                                    //this.pageTwoShow = (data.pageTwoShow == 'Y' ? true : false);
                                    this.pageTwoShow = true;
                                    this.pageThreeShow = false;

                                    this.showNPSHblock = false;
                                    if(this.activeTab === 'extended') {
                                        this.showNPSHblock = true;
                                    }
                                    if (jsonDecArray.SHOW_GRAF == 'Y') {
                                        this.chartData = 'Y'; // Предполагается, что сервер возвращает данные для графика
                                        setTimeout(() => {
                                            let node = document.querySelector('[data-d3js]');
                                            let watermark = 'https://vandjord.com/product_selection/vanv2.png';
                                            let underText = {};
                                            let newNameInfo = data.NAME.split('<br/>');
                                            data.NAME = newNameInfo[0];
                                            if (newNameInfo.length > 1 && newNameInfo[1].length > 0) {
                                                underText.line0 = newNameInfo[1];
                                            }
                                            if (jsonDecArray.TYPE_SS) {
                                                watermark = 'https://vandjord.com/product_selection/shinv2.png';
                                            }
                                            this.watermark = watermark;
                                            let D3jsZ = window.D3jsQ;
                                            svgPictBlockV1 = '';
                                            _this.svg = '';
                                            svgPictBlockV2 = '';
                                            _this.svg2 = '';

                                            D3jsZ.initD3js(
                                                node,
                                                jsonDecArray.JSON_INFO,
                                                (jsonDecArray.INFO_TOCHKA_USER ? jsonDecArray.INFO_TOCHKA_USER : []), // Массив для вставки точки
                                                (jsonDecArray.INFO_TOCHKA ? jsonDecArray.INFO_TOCHKA : []), //точки
                                                (jsonDecArray.INFO_TOCHKA_KPD ? jsonDecArray.INFO_TOCHKA_KPD : []), //точки
                                                (jsonDecArray.INFO_TOCHKA_ANAL ? jsonDecArray.INFO_TOCHKA_ANAL : []), //точки
                                                [jsonDecArray.NAME],
                                                watermark, // Ссылка на логотип для водяного знака
                                                (jsonDecArray.JSON_INFO[3].easing ? true : (jsonDecArray.JSON_INFO[3].easing_1 ? true : false)), // Отобразить на графике второй график КПД
                                                false, // Отобразить на графике второй график NPSH
                                                false, // Вернет svg для вставки в pdf
                                                (jsonDecArray.TEXT_BOTTOM ? jsonDecArray.TEXT_BOTTOM : []), // Текст под графиком
                                                true, // Параметр, который говорит о том, что нужно разделить график на две части и стилизовать его по разному
                                                jsonDecArray.MIN_Q,
                                                jsonDecArray.MAX_Q,
                                                jsonDecArray.QNOM_DLYA_PODBORA,
                                                jsonDecArray.HNOM_DLYA_PODBORA,
                                                jsonDecArray.Q1,
                                                jsonDecArray.Q3,
                                                jsonDecArray.Q9,
                                                jsonDecArray.Q10,
                                                jsonDecArray.H1,
                                                jsonDecArray.H3,
                                                jsonDecArray.H9,
                                                jsonDecArray.H10,
                                                jsonDecArray.UNIT_INFO,
                                                jsonDecArray.UNIT_INFO_H,
                                                jsonDecArray.PP,
                                                jsonDecArray.JSON_INFO_CUSTOM,
                                                jsonDecArray.PCRIT,
                                                (this.liquidValue ? (this.liquidValue.id != 'Вода' ? 'Y' : 'N') : ''),
                                                (jsonDecArray.CUSTOM_GRAF_INFO_DOP ? jsonDecArray.CUSTOM_GRAF_INFO_DOP : []),
                                                jsonDecArray.P1,
                                                jsonDecArray.P3,
                                                jsonDecArray.P9,
                                                jsonDecArray.P10,
                                                (jsonDecArray.VS_PRE_CH ? jsonDecArray.VS_PRE_CH : 0),
                                                (jsonDecArray.VS_PRE_CH_LINE ? jsonDecArray.VS_PRE_CH_LINE : 0),
                                                (jsonDecArray.VUE_MAX_CHASTOTA ? jsonDecArray.VUE_MAX_CHASTOTA : 0),
                                                (jsonDecArray.VUE_MIN_CHASTOTA ? jsonDecArray.VUE_MIN_CHASTOTA : 0),
                                                jsonDecArray.Q9_H9,
                                                jsonDecArray.HCRIT,
                                                jsonDecArray.HQCRIT,
                                            );

                                            if ($(node).length > 0 && $(node)[0].outerHTML) {
                                                setTimeout(function () {
                                                    //svgPictBlockV1 = new XMLSerializer().serializeToString($(node)[0].innerHTML);
                                                    svgPictBlockV1 = $(node)[0].outerHTML;//jsonDecArray.ID
                                                    _this.svg = svgPictBlockV1;
                                                }, 200);
                                            }
                                            let nodeNPSH = document.querySelector('[data-d3jsNPSH]');
                                            if (
                                                jsonDecArray.JSON_INFO[3].p_two > 0 || jsonDecArray.JSON_INFO[3].p_two_1 > 0
                                            ) {
                                                $(nodeNPSH).show();
                                                if(_this.activeTab === 'extended') {
                                                    _this.showNPSHblock = true;
                                                }

                                                D3jsZ.initD3js(
                                                    nodeNPSH,
                                                    jsonDecArray.JSON_INFO,
                                                    [], // Массив для вставки точки
                                                    (jsonDecArray.INFO_TOCHKA_P ? jsonDecArray.INFO_TOCHKA_P : []), //точки
                                                    (jsonDecArray.INFO_TOCHKA_NPSH ? jsonDecArray.INFO_TOCHKA_NPSH : []), //точки
                                                    [], //точки
                                                    [],
                                                    watermark, // Ссылка на логотип для водяного знака
                                                    false, // Отобразить на графике второй график КПД
                                                    (jsonDecArray.JSON_INFO[3].p_two > 0 ? true : (jsonDecArray.JSON_INFO[3].p_two_1 > 0 ? true : false)), // Отобразить на графике второй график NPSH
                                                    false, // Вернет svg для вставки в pdf
                                                    [], // Текст под графиком
                                                    true, // Параметр, который говорит о том, что нужно разделить график на две части и стилизовать его по разному
                                                    jsonDecArray.MIN_Q,
                                                    jsonDecArray.MAX_Q,
                                                    jsonDecArray.QNOM_DLYA_PODBORA,
                                                    jsonDecArray.HNOM_DLYA_PODBORA,
                                                    jsonDecArray.Q1,
                                                    jsonDecArray.Q3,
                                                    jsonDecArray.Q9,
                                                    jsonDecArray.Q10,
                                                    jsonDecArray.H1,
                                                    jsonDecArray.H3,
                                                    jsonDecArray.H9,
                                                    jsonDecArray.H10,
                                                    jsonDecArray.UNIT_INFO,
                                                    jsonDecArray.UNIT_INFO_H,
                                                    jsonDecArray.PP,
                                                    (this.liquidValue ? (this.liquidValue.id != 'Вода' ? jsonDecArray.JSON_INFO_CUSTOM : []) : []),
                                                    jsonDecArray.PCRIT,
                                                    (this.liquidValue ? (this.liquidValue.id != 'Вода' ? 'Y' : 'N') : ''),
                                                    [],
                                                    jsonDecArray.P1,
                                                    jsonDecArray.P3,
                                                    jsonDecArray.P9,
                                                    jsonDecArray.P10,
                                                    0,
                                                    0,
                                                    0,
                                                    0,
                                                    jsonDecArray.Q9_P9
                                                );
                                                if(this.activeTab === 'extended') {
                                                    this.showNPSHblock = true;
                                                }
                                                if ($(nodeNPSH).length > 0 && $(nodeNPSH)[0].outerHTML) {
                                                    setTimeout(function () {
                                                        //svgPictBlockV1 = new XMLSerializer().serializeToString($(node)[0].innerHTML);
                                                        svgPictBlockV2 = $(nodeNPSH)[0].outerHTML;
                                                        _this.svg2 = svgPictBlockV2;
                                                        if(_this.activeTab === 'extended') {
                                                            _this.showNPSHblock = true;
                                                        }
                                                    }, 200);
                                                }
                                            } else {
                                                _this.showNPSHblock = false;
                                            }
                                        }, 500);
                                        this.pageThreeShow = true;
                                    } else {
                                        this.chartData = '';
                                        svgPictBlockV1 = '';
                                        _this.svg = '';
                                        svgPictBlockV2 = '';
                                        _this.svg2 = '';
                                        let node = document.querySelector('[data-d3js]');
                                        let nodeNPSH = document.querySelector('[data-d3jsNPSH]');
                                        $(node)[0].innerhtml = '';
                                        $(nodeNPSH)[0].innerhtml = '';
                                    }
                                    if (this.chartData != 'Y') {
                                        this.chartDataShow = 'Y';
                                        this.activeMainTab = 'photo';
                                    } else {
                                        this.chartDataShow = null;
                                    }
                                    if (this.chartData != 'Y' && !this.photoData) {
                                        this.activeMainTab = 'drawing';
                                    }
                                    if (this.chartData != 'Y' && !this.photoData && !this.gabChert
                                        && this.chartData != 'Y' && !this.photoData && !this.elSchema
                                        && this.chartData != 'Y' && !this.photoData && !this.schemMon
                                    ) {
                                        this.activeMainTab = 'docData';
                                    }

                                    setTimeout(() => {
                                        if(this.downLoadArtFull != '') {
                                            const needle = JSON.stringify(this.selectedRow);
                                            const index = this.displayData.findIndex(row => JSON.stringify(row) === needle);

                                            if (this.svg != '') {
                                                this.downloadPassportCustomDownload(this.selectedRow);
                                            }
                                            if (index < (this.displayData.length - 1)) {
                                                this.selectRow(this.displayData[(index + 1)]);
                                            } else if (this.displayData.length == this.count) {
                                                this.page += 1;
                                                this.submitForm();
                                            }
                                        }
                                        resolve();
                                    }, 1000);
                                }
                            }
                        })
                        .catch(error => {
                            console.error('Ошибка при отправке данных строки:', error);
                            reject(error); // Завершаем промис с ошибкой
                        })
                        .finally(() => {
                            this.isLoading = false; // Выключаем прелоадер
                        });
                } else {
                    resolve();
                }
            });
        },
        savePopupParamsErrorListShow($text, $art, $count) {
            this.textList = $text;
            this.textListArt = $art;
            this.textListCount = 'Итого в наличии - '+$count;
            // Здесь можно добавить логику для сохранения параметров
            this.showPopupErrorList = true;
        },
        savePopupParamsErrorList() {
            // Здесь можно добавить логику для сохранения параметров
            this.showPopupErrorList = false;
        },
        saveShowPopupErrorReqVSsr() {
            // Здесь можно добавить логику для сохранения параметров
            this.showPopupErrorReqVSsr = false;
        },
        saveShowPopupErrorReqVS() {
            // Здесь можно добавить логику для сохранения параметров
            this.showPopupErrorReqVS = false;
        },
        savePopupParamsError() {
            // Здесь можно добавить логику для сохранения параметров
            this.showPopupError = false;
        },
        savePopupParamsDubleError() {
            // Здесь можно добавить логику для сохранения параметров
            this.showPopupErrorDuble = false;
        },
        savePopupParamsErrorReq() {
            // Здесь можно добавить логику для сохранения параметров
            this.showPopupErrorReq = false;
        },
        savePopupParamsAnalError() {
            // Здесь можно добавить логику для сохранения параметров
            this.showPopupAnalError = false;
        },
        savePopupParamsAnalDataError() {
            // Здесь можно добавить логику для сохранения параметров
            this.showPopupAnalDataError = false;
        },
        saveShowPromiseAlertError() {
            // Здесь можно добавить логику для сохранения параметров
            this.showPromiseAlert = false;
        },
        savePopupParams() {
            // Здесь можно добавить логику для сохранения параметров
            this.showPopup = false;
        },
        downloadPassportTechStep(row) {
            // Здесь можно добавить логику для скачивания паспорта
            if (!this.selectedRow) {
                alert('Выберите насос');
                return;
            }
            this.showInputPopup = true;
        },
        downloadPassportTechStepCustom(row) {
            // Здесь можно добавить логику для скачивания паспорта
            if (!this.selectedRow) {
                alert('Выберите насос');
                return;
            }
            this.showInputPopupCustom = true;
        },
        downloadPassportTechStepZip(row) {
            // Здесь можно добавить логику для скачивания паспорта
            if (!this.selectedRow) {
                alert('Выберите насос');
                return;
            }
            this.isLoadingButton = true;
            this.isLoading = true; // Включаем прелоадер
            const payload = {
                svg: this.svg, // Скрыть цену
                svg2: this.svg2, // Скрыть цену
                hidePrice: this.hidePrice, // Скрыть цену
                hideArticle: this.hideArticle, // Скрыть артикул
                addNumber: this.addNumber, // Скрыть артикул
                dateCreated: this.dateCreated, // Скрыть артикул
                flowUnit: this.selectedUnits.flow, // Единица измерения расхода
                pressureUnit: this.selectedUnits.pressure, // Единица измерения напора
                selectedCellData: this.selectedRow[0] // Замените someCell на нужное поле из выбранной строки
            }

            fetch('/product_selection/test_gen_zip.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(response => response.json())
                .then(data => {
                    window.open(data, '_blank');
                })
                .catch(error => {
                    console.error('Ошибка при отправке данных строки:', error);
                })
                .finally(() => {
                    this.isLoadingButton = false; // Выключаем прелоадер
                    this.isLoading = false; // Выключаем прелоадер
                });
        },
        downloadPassportTechStepZipGBL() {
            this.showPopupErrorListGBL = true;
        },
        downloadPassportTech(row) {
            // Здесь можно добавить логику для скачивания паспорта
            if (!this.selectedRow) {
                alert('Выберите насос');
                return;
            }
            this.isLoadingButton = true;
            //this.isLoading = true; // Включаем прелоадер
            this.blockUI(); // ВКЛ блокировку
            const payload = {
                svg: this.svg, // Скрыть цену
                svg2: this.svg2, // Скрыть цену
                hidePrice: this.hidePrice, // Скрыть цену
                hideArticle: this.hideArticle, // Скрыть артикул
                addNumber: this.addNumber, // Скрыть артикул
                dateCreated: this.dateCreated, // Скрыть артикул
                flowUnit: this.selectedUnits.flow, // Единица измерения расхода
                pressureUnit: this.selectedUnits.pressure, // Единица измерения напора
				idIndoAnalId: this.idIndoAnalId,
                selectedParallelConnection: this.selectedParallelConnection, // Скрыть цену
                selectedBackupPumps: this.selectedBackupPumps, // Скрыть цену
                selectedCellData: this.selectedRow[0] // Замените someCell на нужное поле из выбранной строки
            }

            fetch('/product_selection/test_gen_pdf.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(response => response.json())
                .then(data => {
                    window.open(data, '_blank');
                })
                .catch(error => {
                    console.error('Ошибка при отправке данных строки:', error);
                })
                .finally(() => {
                    this.isLoadingButton = false; // Выключаем прелоадер
                    this.unblockUI(); // ВЫКЛ блокировку
                    //this.isLoading = false; // Выключаем прелоадер
                });
        },
        handleDownload(row, show = 'N') {
            // Проверяем, выбрана ли строка
            if (this.selectedRow !== row) {
                // Если строка не выбрана, сначала выбираем её
                this.selectRow(row)
                    .then(() => {
                        // После выбора строки продолжаем логику
                        if (show === 'Y') {
                            this.showPopupNo()
                                .then(() => {
                                    this.downloadPassport(row);
                                });
                        } else {
                            this.downloadPassport(row);
                        }
                    });
            } else {
                // Теперь выполняем логику для скачивания файла
                if (show === 'Y') {
                    this.showPopupNo()
                        .then(() => {
                            // После закрытия popup продолжаем выполнение кода
                            this.downloadPassport(row);
                        });
                } else {
                    // Если show не равно "Y", сразу продолжаем выполнение
                    this.downloadPassport(row);
                }
            }
        },
        submitFormCustom: function (e) {
            let infoQ = $('.js-m3-info-q').attr('custom-info');
            let infoH = $('.js-m3-info-h').attr('custom-info');
            let _this = this;
            if (parseFloat(infoQ) > 0 && parseFloat(infoH) > 0) {
                _this.flowValue = infoQ;
                _this.pressureValue = infoH;
                if (parseFloat(_this.staticPressureValue) > parseFloat(_this.pressureValue)) {
                    this.showPopupError = true;
                    return false;
                }
                _this.sendRowData(this.selectedRow);
            } else {
                _this.flowValue = _this.flowValue;
                _this.pressureValue = _this.pressureValue;
            }
        },
        downloadPassportCustomDownload(row) {
            if (!this.selectedRow) {
                alert('Выберите насос');
                return;
            }
            const payload = {
                svg: this.svg, // Скрыть цену
                svg2: this.svg2, // Скрыть цену
                watermark: this.watermark, // Скрыть цену
                selectedCellData: this.selectedRow[0], // Замените someCell на нужное поле из выбранной строки
                name: this.selectedRow[2], // Замените someCell на нужное поле из выбранной строки
                art: this.selectedRow[1], // Замените someCell на нужное поле из выбранной строки
            }

            fetch('/product_selection_new/pdf_htmlV2.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            //.then(data => openPdfInNewTab(typeof data === "string" ? data : data.url))
            .then(data => {
            })
            .catch(error => {
                console.error('Ошибка при отправке данных строки:', error);
            })
            .finally(() => {
            }
            );
        },
        downloadPassport(row) {
            // Здесь можно добавить логику для скачивания паспорта
            if (this.isLoadingButtonD) {
                return;
            }
            if (!this.selectedRow) {
                alert('Выберите насос');
                return;
            }
            this.isLoadingButtonD = true; // Включаем прелоадер
            //this.isLoading = true; // Включаем прелоадер
            this.blockUI(); // ВКЛ блокировку
            const payload = {
                svg: this.svg, // Скрыть цену
                svg2: this.svg2, // Скрыть цену
                watermark: this.watermark, // Скрыть цену
                tolerance: this.tolerance, // Скрыть цену
                frequencyControl: this.frequencyControl, // Скрыть цену
                frequencyControlZonService: this.frequencyControlZonService, // Скрыть цену
                selectedParallelConnection: this.selectedParallelConnection, // Скрыть цену
                selectedBackupPumps: this.selectedBackupPumps, // Скрыть цену
                hidePrice: this.hidePriceQ, // Скрыть цену
                hideArticle: this.hideArticleQ, // Скрыть артикул
                flowValue: this.flowValue, // Скрыть артикул
                pressureValue: this.pressureValue, // Скрыть артикул
                staticPressureValue: this.staticPressureValue, // Скрыть артикул
                flowUnit: this.selectedUnits.flow, // Единица измерения расхода
                pressureUnit: this.selectedUnits.pressure, // Единица измерения напора
				idIndoAnalId: this.idIndoAnalId,
                pageOne: (this.pageOneShow ? this.pageOne : false), // Единица измерения напора
                pageTwo: (this.pageTwoShow ? this.pageTwo : false), // Единица измерения напора
                pageThree: (this.pageThreeShow ? this.pageThree : false), // Единица измерения напора
                pageFor: (this.pageForShow ? this.pageFor : false), // Единица измерения напора
                pageFive: (this.pageFiveShow ? this.pageFive : false), // Единица измерения напора
                pageSix: (this.pageSixShow ? this.pageSix : false), // Единица измерения напора
                selectedCellData: this.selectedRow[0], // Замените someCell на нужное поле из выбранной строки
                pKRIT: (this.liquidValue ? (this.liquidValue.id != 'Вода' ? window.infoDateQ : '') : '')// Замените someCell на нужное поле из выбранной строки
            }

            fetch('/product_selection/pdf_html.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(response => response.json())
                //.then(data => openPdfInNewTab(typeof data === "string" ? data : data.url))
                .then(data => {
                    const absUrl = toAbsoluteUrl(typeof data === "string" ? data : data.url);

                    if (!absUrl) {
                        throw new Error('URL не получен');
                    }

                    // Скачиваем файл как Blob, чтобы избежать всплывающих окон браузера
                    return fetch(absUrl)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Не удалось загрузить файл');
                            }
                            return response.blob();
                        })
                        .then(blob => {
                            // Извлекаем имя файла из URL
                            const fileName = decodeURIComponent(absUrl.split('/').pop().split('?')[0]) || 'passport.pdf';

                            // Создаём временный URL для Blob
                            const blobUrl = window.URL.createObjectURL(blob);

                            // Создаём ссылку и инициируем скачивание
                    const link = document.createElement('a');
                            link.href = blobUrl;
                            link.download = fileName; // Принудительное скачивание
                            link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                            // Освобождаем память
                            setTimeout(() => {
                                window.URL.revokeObjectURL(blobUrl);
                            }, 100);

                    this.showInputPopupCustom = false;
                        });
                })
                .catch(error => {
                    console.error('Ошибка при отправке данных строки:', error);
                })
                .finally(() => {
                    this.isLoadingButtonD = false; // Выключаем прелоадер
                    //this.isLoading = false; // Выключаем прелоадер
                    this.unblockUI(); // ВЫКЛ блокировку
                });
        },
        updateBackupPumps() {
            /*if(this.selectedParallelConnection == null) {
                this.selectedParallelConnection = {value:1};
            }
            this.selectedBackupPumps = '';
            const selectedCount = parseInt(this.selectedParallelConnection.value) || 0;
            this.backupPumpsOptions = Array.from({length: selectedCount - 1}, (v, i) => ({
                value: i + 1,
                text: `${i + 1}`
            }));*/
            const mainCount = parseInt(this.selectedParallelConnection?.value) || 0;
            const maxBackup = 10 - mainCount;

            // Если текущее значение резервных больше допустимого — сбрасываем
            if (this.selectedBackupPumps && parseInt(this.selectedBackupPumps.value) > maxBackup) {
                this.selectedBackupPumps = '';
            }

            this.backupPumpsOptions = Array.from({ length: Math.max(maxBackup, 0) }, (v, i) => ({
                value: i + 1,
                text: `${i + 1}`
            }));

            // Основные опции — все 10 (можно ограничить, если нужно)
            this.parallelConnectionOptions = Array.from({ length: 10 }, (v, i) => ({
                value: i + 1,
                text: `${i + 1}`
            }));
        },
        updateBackupPumpsZ() {
            const backupCount = parseInt(this.selectedBackupPumps?.value) || 0;

            // Если выбрали резервные, а основных нет — ставим 1 основной
            if (backupCount > 0 && (this.selectedParallelConnection == null || !this.selectedParallelConnection.value)) {
                this.selectedParallelConnection = { value: 1,text: 1 };
            }

            const maxMain = 10 - backupCount;

            // Если текущее значение основных превышает допустимое — корректируем
            if (this.selectedParallelConnection && parseInt(this.selectedParallelConnection.value) > maxMain) {
                this.selectedParallelConnection = { value: maxMain,text: maxMain };
            }

            this.parallelConnectionOptions = Array.from({ length: Math.max(maxMain, 1) }, (v, i) => ({
                value: i + 1,
                text: i + 1
            }));

            // Резервные опции — пересчитываем под текущие основные
            const mainCount = parseInt(this.selectedParallelConnection?.value) || 0;
            const maxBackup = 10 - mainCount;
            this.backupPumpsOptions = Array.from({ length: Math.max(maxBackup, 0) }, (v, i) => ({
                value: i + 1,
                text: `${i + 1}`
            }));
        },
        updateParallelConnectionOptions() {
            const selectedValue = this.selectedParallelConnection;
            this.parallelConnectionOptions = Array.from({length: selectedValue}, (_, i) => ({
                value: i + 1,
                //text: `${i + 1} насос${i === 0 ? '' : 'а'}` // Формируем текст для отображения
                text: `${i + 1}` // Формируем текст для отображения
            }));
        },
        handleCustomGraphToggle() {
            if (!this.addCustomGraph) {
                // Очищаем данные по параметрам произвольного графика
                this.customGraph.name = '';
                this.customGraph.points = Array.from({length: 5}, () => ({q: null, h: null}))
            }
            this.resetCustomGrafTable();
        },
        anotherMethod() {
            if (this.frequencyControl) {
                //this.tolerance = 0;
            }
        },
        resetParameters(editLogic = false, forceRes = false) {
            // Логика сброса параметров
            let node = document.querySelector('[data-d3js]');
            let nodeNPSH = document.querySelector('[data-d3jsNPSH]');
            $(node)[0].innerhtml = '';
            $(nodeNPSH)[0].innerhtml = '';
            if (node) {
                node.innerHTML = '';
            }
            if (nodeNPSH) {
                nodeNPSH.innerHTML = '';
            }
            this.svg = '';
            this.svg2 = '';
            if ((this.activeTabPrev == 'quick' || this.activeTabPrev === 'custom') && !forceRes) {

            } else {
                this.selectedApplication = ''; // Сброс выбора приложения
                this.selectedUnits = { // Сброс единиц измерения
                    power: 'кВт',
                    flow: 'м³/ч',
                    pressure: 'м',
                    staticPressure: 'м',
                    concentration: '%',
                    density: 'кг/м³'
                };
                this.flowValue = ''; // Сброс для расхода
                this.pressureValue = ''; // Сброс для напора
                this.staticPressureValue = ''; // Сброс для статического напора
                //this.liquidValue = 'Вода'; // Сброс для жидкостиthis.selectedManufacturer = {id: 'Grundfos', name: 'Grundfos'};
                this.maxTempValue = 20; // Сброс для максимальной температуры

            }
            this.analog = {
                rpat: 'Совпадает',
                t: 'Может различаться',
                pw: 'Может различаться',
                pVikl: 'Может различаться',
                pViklQ: 'Может различаться',
                dl: 'Совпадает',
                dlV: 'Может различаться'
            };
            this.gbl = ''; // Сброс для концентрации
            this.liquidCustom = '';
            this.addCustomGraph = false; // Сброс для концентрации
            this.showNPSHblock = false;
            this.selectedName = ''; // Сброс для концентрации
            this.densityValue = '998.2'; // Сброс для плотности
            this.densityValueV = ''; // Сброс для плотности
            this.selectedBackupPumps = ''; // Сброс выбранных резервных насосов
            this.showNoAdd = 'N'; // Сброс выбранных резервных насосов
            this.selectedParallelConnection = ''; // Сброс выбранного параллельного соединения
            this.backupPumpsOptions = Array.from({ length: 9 }, (v, i) => ({
                value: i + 1,
                text: `${i + 1}`
            })); // Сброс опций резервных насосов
            this.frequencyControl = false; // Сброс состояния чекбокса
            this.frequencyControlZon = false; // Сброс состояния чекбокса
            this.frequencyControlZonService = false; // Сброс состояния чекбокса
            this.downLoadArtFull = false; // Сброс состояния чекбокса
            this.count = 50; // Сброс состояния чекбокса
            this.page = 1; // Сброс состояния чекбокса
            this.customGraph = { // Сброс параметров произвольного графика
                name: '',
                points: Array.from({length: 5}, () => ({q: null, h: null}))
            };
            this.rightPanelContent = ''; // Сброс контента правой панели
            this.dataTableContent = []; // Сброс данных таблицы
            this.tableHeaders = []; // Сброс заголовков таблицы
            if (!editLogic && !forceRes) {
                this.activeTab = 'quick'; // Сброс активного таба
            }
            this.showAnalog = false; // Закрытие всплывающего окна
            this.showAnalogPop = false; // Закрытие всплывающего окна
            this.showAnalogPopRNP = false; // Закрытие всплывающего окна
            this.showAnalogPopNM = false; // Закрытие всплывающего окна
            this.showAnalogPopF = false; // Закрытие всплывающего окна
            this.showAnalogPopTM = false; // Закрытие всплывающего окна
            this.showAnalogPopMD = false; // Закрытие всплывающего окна
            this.showAnalogPopMDV = false; // Закрытие всплывающего окна
            this.showAnalogPopPV = false; // Закрытие всплывающего окна

            this.showPopup = false; // Закрытие всплывающего окна
            this.articleInput = ''; // Сброс значения артикула или наименования
            this.wheelMaterial = ''; // Сброс материала рабочего колеса
            //this.typeMaterial = ''; // Сброс материала рабочего колеса
            this.wheelType = ''; // Сброс типа рабочего колеса
            //this.typeMaterialCount = [];
            this.maxWorkingPressure = ''; // Сброс максимального рабочего давления
            this.maxWorkingPressureFree = ''; // Сброс максимального рабочего давления
            this.maxWorkingPressureFreeFrom = ''; // Сброс максимального рабочего давления
            this.maxWorkingPressureFreeTo = ''; // Сброс максимального рабочего давления
            this.bodyMaterial = ''; // Сброс материала корпуса
            this.selectedSizeTypes = [];
            this.selectedServiceFactor = [];
            this.selectedDischargeSizes = [];
            this.selectedSuctionSizes = [];
            this.selectedTypeMontag = [];
            this.selectedTimeWork = [];
            this.selectedVsPopVikl = [];
            this.selectedVsPopViklQ = [];
            this.selectedPowers = [];
            this.selectedPhaseCount = '';
            this.hideArticle = '';
            this.hidePrice = '';
            this.hideArticleQ = '';
            this.hidePriceQ = '';
            this.selectedPoleCount = '';
            this.chartDataShow = ''; // Предполагается, что сервер возвращает данные для графика
            this.chartDataShowF = ''; // Предполагается, что сервер возвращает данные для графика
            this.chartDataShowC = ''; // Предполагается, что сервер возвращает данные для графика
            this.chartData = ''; // Предполагается, что сервер возвращает данные для графика
            this.photoData = ''; // Предполагается, что сервер возвращает URL фото
            this.drawingData = ''; // Предполагается, что сервер возвращает URL чертежа
            this.gabChert = ''; // Предполагается, что сервер возвращает URL чертежа
            this.elSchema = ''; // Предполагается, что сервер возвращает URL чертежа
            this.schemMon = ''; // Предполагается, что сервер возвращает URL чертежа
            this.activeMainTabChert = ''; // Предполагается, что сервер возвращает URL чертежа
            this.docData = '';
            this.techData = '';
            this.techDataBim = '';
            this.techDataDwg3D = '';
            this.techDataDwg2D = '';
            this.techDataGig = '';
            this.techDataSertSeq = '';
            this.techDataCatInfo = '';
            this.techDataSerInfo = '';
            this.techDataRukInfo = '';
            this.selectedManufacturer = [], // Значение по умолчанию;
                this.selectedName = [], // Значение по умолчанию;
                this.selectedEquipmentTypes = [];
            this.applications = this.defaultParams.applications;
            if (!this._fullLiquidBackup) {
                this._fullLiquidBackup = [...this.defaultParams.liquid];
            }
            this.liquid = this.defaultParams.liquid;
            if(this.activeTab == 'analog'){
                this.liquid = this._fullLiquidBackup.slice(0, 1);
            } else {
                this.liquid = this._fullLiquidBackup
                    ? [...this._fullLiquidBackup]
                    : [...this.defaultParams.liquid];
            }
            this.concentrationValueID = this.defaultParams.concentrationValueID;
            const def = this.liquid.find(o => o.id === this.liquidValueDefault);
            if (def) {
                this.liquidValue = def;
            } else if (this.liquid.length) {
                this.liquidValue = this.liquid[0];
            }
            if(this.activeTabPrev != 'quick') {
                this.equipmentTypes = this.defaultParams.equipmentTypes;
                this.poleCounts = this.defaultParams.poleCounts;
                this.phaseCounts = this.defaultParams.phaseCounts;
                this.powers = this.defaultParams.powers;
                this.timeWork = this.defaultParams.timeWork;
                this.vsPopVikl = this.defaultParams.vsPopVikl;
                this.vsPopViklQ = this.defaultParams.vsPopViklQ;
                this.typeMontag = this.defaultParams.typeMontag;
                this.suctionSizes = this.defaultParams.suctionSizes;
                this.dischargeSizes = this.defaultParams.dischargeSizes;
                this.wheelMaterialCount = this.defaultParams.wheelMaterialCount;
                this.wheelTypeOptions = this.defaultParams.wheelTypeOptions;
                this.wheelTypeCount = this.defaultParams.wheelTypeCount;
                this.wheelTypeCountFree = this.defaultParams.wheelTypeCountFree;
                this.bodyMaterialCount = this.defaultParams.bodyMaterialCount;
                this.sizeTypes = this.defaultParams.sizeTypes;
                this.serviceFactor = this.defaultParams.serviceFactor;
            }
            this.dateCreated = '';
            this.addNumber = '';
            this.watermark = '';
            this.customTypeFilter = '';
            this.anal = '';
            this.recalcDensity();

            //this.loadApplications(); // Вызов метода при монтировании компонента
            //this.loadDischargeSizes(); // Загрузка размеров напорного патрубка
            //this.loadSuctionSizes(); // Загрузка размеров всасывающего патрубка
            //this.loadPowers(); // Загрузка мощностей
            //this.loadPhaseCounts(); // Загрузка количеств фаз
            //this.loadSizeTypes(); // Загрузка количеств фаз
            //this.loadPoleCounts(); // Загрузка количеств полюсов
            this.loadManufacturers();
            //this.fetchBodyMaterial();
            //this.fetchWheelMaterial();
            ////this.fetchTypeMaterial();
            //this.fetchMaxRabDav();
            this.fetchNames();

            if (this.activeTab === 'analog') {
                this.additionalParamsShow = false;
            } else {
                this.additionalParamsShow = true;
            }

        },
        setActiveTab(tabId) {
            this.activeTabPrev = this.activeTab; // Устанавливаем новый активный таб
            this.activeTab = tabId; // Устанавливаем новый активный таб
            this.resetParameters(true); // Сбрасываем параметры
            this.activeTabPrev = '';
        },
        resetCustomGrafTable() {

            if (this.selectedName) {
                this.showAnalog = false;
                this.showAnalogPop = false; // Закрытие всплывающего окна
                this.showAnalogPopRNP = false; // Закрытие всплывающего окна
                this.showAnalogPopNM = false; // Закрытие всплывающего окна
                this.showAnalogPopF = false; // Закрытие всплывающего окна
                this.showAnalogPopTM = false; // Закрытие всплывающего окна
                this.showAnalogPopMD = false; // Закрытие всплывающего окна
                this.showAnalogPopMDV = false; // Закрытие всплывающего окна
                this.showAnalogPopPV = false; // Закрытие всплывающего окна
                this.showNPSHblock = false;
                this.allNames.filter(name => {
                    let parsedArray1 = parseStringToArray(name.type);
                    let result1 = compareKeys(parsedArray1, this.analogInfoBlock);
                    if (this.selectedName.id == name.name) {

                        if (result1.length > 0) {
                            this.showAnalog = true;
                        }
                        if(name.showPop == 'Y'){
                            this.showAnalogPop = true;
                        } else {
                            this.showAnalogPop = false;
                        }
                        if(name.showPopRNP == 'Y'){
                            this.showAnalogPopRNP = true;
                        } else {
                            this.showAnalogPopRNP = false;
                        }
                        if(name.showPopNM == 'Y'){
                            this.showAnalogPopNM = true;
                        } else {
                            this.showAnalogPopNM = false;
                        }
                        if(name.showPopF == 'Y'){
                            this.showAnalogPopF = true;
                        } else {
                            this.showAnalogPopF = false;
                        }
                        if(name.showPopTM == 'Y'){
                            this.showAnalogPopTM = true;
                        } else {
                            this.showAnalogPopTM = false;
                        }
                        if(name.showPopMD == 'Y'){
                            this.showAnalogPopMD = true;
                        } else {
                            this.showAnalogPopMD = false;
                        }
                        if(name.showPopMDV == 'Y'){
                            this.showAnalogPopMDV = true;
                        } else {
                            this.showAnalogPopMDV = false;
                        }
                        if(name.showPopPV == 'Y'){
                            this.showAnalogPopPV = true;
                        } else {
                            this.showAnalogPopPV = false;
                        }
                    }
                    return 1; // Сравниваем поле proz с id производителя
                });
            }

            let node = document.querySelector('[data-d3js]');
            let nodeNPSH = document.querySelector('[data-d3jsNPSH]');
            $(node)[0].innerhtml = '';
            $(nodeNPSH)[0].innerhtml = '';
            if (node) {
                node.innerHTML = '';
            }
            this.chartDataShow = ''; // Предполагается, что сервер возвращает данные для графика
            this.chartDataShowF = ''; // Предполагается, что сервер возвращает данные для графика
            this.chartDataShowC = ''; // Предполагается, что сервер возвращает данные для графика
            this.chartData = ''; // Предполагается, что сервер возвращает данные для графика
            this.photoData = ''; // Предполагается, что сервер возвращает URL фото
            this.drawingData = ''; // Предполагается, что сервер возвращает URL чертежа
            this.gabChert = ''; // Предполагается, что сервер возвращает URL чертежа
            this.elSchema = ''; // Предполагается, что сервер возвращает URL чертежа
            this.schemMon = ''; // Предполагается, что сервер возвращает URL чертежа
            this.activeMainTabChert = ''; // Предполагается, что сервер возвращает URL чертежа
            this.docData = '';
            this.techData = '';
            this.techDataBim = '';
            this.techDataDwg3D = '';
            this.techDataDwg2D = '';
            this.techDataGig = '';
            this.techDataSertSeq = '';
            this.techDataCatInfo = '';
            this.techDataSerInfo = '';
            this.techDataRukInfo = '';
            this.dataTableContent = []; // Сброс данных таблицы
            this.tableHeaders = []; // Сброс заголовков таблицы
        },
        updateEquipmentTypes($ccInf = false) {
            this.resetCustomGrafTable();
            if (this.activeTab === 'analog' && this.activeTabPrev === 'custom') {
                this.selectedManufacturer = [];
                this.selectedName = [];
                this.loadManufacturers();
                this.fetchNames();
            }
            if (this.activeTab === 'analog') {
                this.activeTabPrev = 'custom';
            } else {
                this.activeTabPrev = '';
            }
            if(this.selectedApplication != ''
                && (this.selectedApplication.id == 'Установки повышения давления'
                || this.selectedApplication.id == 'Пожаротушение')
                //&& this.selectedBackupPumps == ''
            ){
                this.selectedBackupPumps = { value: 1,text: 1 };
            } else {
                this.selectedBackupPumps = '';
            }
            if ($ccInf) {
                const urlParams = new URLSearchParams(window.location.search);
                const custom = urlParams.get('custom'); // вернёт строку или null
                fetch(`/product_selection/equipment_types.php?application_id=${JSON.stringify(this.selectedApplication)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                    .then(response => response.json())
                    .then(data => {
                        if (Object.values(data)) {
                            this.equipmentTypes = Object.values(data); // Обновляем массив мощностей
                        } else {
                            console.error('Ошибка: данные не являются массивом', data);
                        }
                        if (this.defaultParams.equipmentTypes.length == 0) {
                            this.defaultParams.equipmentTypes = this.equipmentTypes;
                        }
                        if (this.selectedApplication) {
                            this.selectedEquipmentTypes = []; // Сбрасываем выбранные типы оборудования
                            this.selectedSizeTypes = []; // Сбрасываем выбранные типоразмеры
                            this.selectedServiceFactor = []; // Сбрасываем выбранные типоразмеры
                            this.loadDischargeSizes();
                            this.loadSuctionSizes();
                            this.loadTypeMontag();
                            this.loadTimeWork();
                            this.loadVsPopVikl();
                            this.loadVsPopViklQ();
                            this.loadPowers();
                            this.loadPhaseCounts();
                            this.loadSizeTypes();
                            this.loadServiceFactor();
                            this.loadPoleCounts();
                            this.fetchMaxRabDav();
                            this.fetchMaxRabDavFree();
                        } else {
                            this.selectedEquipmentTypes = []; // Сбрасываем выбранные типы оборудования
                            this.selectedSizeTypes = []; // Сбрасываем выбранные типоразмеры
                            this.selectedServiceFactor = []; // Сбрасываем выбранные типоразмеры
                            this.dischargeSizes = this.defaultParams.dischargeSizes;
                            this.suctionSizes = this.defaultParams.suctionSizes;
                            this.typeMontag = this.defaultParams.typeMontag;
                            this.timeWork = this.defaultParams.timeWork;
                            this.vsPopVikl = this.defaultParams.vsPopVikl;
                            this.vsPopViklQ = this.defaultParams.vsPopViklQ;
                            this.powers = this.defaultParams.powers;
                            this.phaseCounts = this.defaultParams.phaseCounts;
                            this.sizeTypes = this.defaultParams.sizeTypes;
                            this.serviceFactor = this.defaultParams.serviceFactor;
                            this.poleCounts = this.defaultParams.poleCounts;
                            this.wheelTypeCount = this.defaultParams.wheelTypeCount;
                            this.wheelTypeCountFree = this.defaultParams.wheelTypeCountFree;
                            this.bodyMaterialCount = this.defaultParams.bodyMaterialCount;
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка при загрузке типов оборудования:', error);
                    });
            }
        },
        loadSizeTypes($ccInf = false) {
            this.resetCustomGrafTable();

            if (!$ccInf) {
                const urlParams = new URLSearchParams(window.location.search);
                const custom = urlParams.get('custom'); // вернёт строку или null
                fetch(`/product_selection/size_types.php?application_id=${JSON.stringify(this.selectedApplication)}&equipment_type_ids=${JSON.stringify(this.selectedEquipmentTypes)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                    .then(response => response.json())
                    .then(data => {
                        if (Object.values(data)) {
                            this.sizeTypes = Object.values(data); // Обновляем массив мощностей
                        } else {
                            console.error('Ошибка: данные не являются массивом', data);
                        }
                        if (this.defaultParams.sizeTypes.length == 0) {
                            this.defaultParams.sizeTypes = this.sizeTypes;
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка при загрузке типоразмеров:', error);
                    });
            } else {
                //this.sizeTypes = []; // Очищаем типоразмеры, если тип оборудования не выбран
            }
        },
        loadServiceFactor() {
            fetch(`/product_selection_new/serviceFactor.php?application_id=${JSON.stringify(this.selectedApplication)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.serviceFactor = Object.values(data); // Обновляем массив мощностей
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.serviceFactor.length == 0) {
                        this.defaultParams.serviceFactor = this.serviceFactor;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при загрузке мощностей:', error);
                });
        },
        loadDischargeSizes() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/discharge_sizes.php?application_id=${JSON.stringify(this.selectedApplication)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.dischargeSizes = Object.values(data); // Обновляем массив мощностей
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.dischargeSizes.length == 0) {
                        this.defaultParams.dischargeSizes = this.dischargeSizes;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при загрузке размеров напорного патрубка:', error);
                });
        },
        loadSuctionSizes() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/suction_sizes.php?application_id=${JSON.stringify(this.selectedApplication)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.suctionSizes = Object.values(data); // Обновляем массив мощностей
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.suctionSizes.length == 0) {
                        this.defaultParams.suctionSizes = this.suctionSizes;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при загрузке размеров всасывающего патрубка:', error);
                });
        },
        loadTypeMontag() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/type_montag.php?application_id=${JSON.stringify(this.selectedApplication)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.typeMontag = Object.values(data); // Обновляем массив мощностей
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.typeMontag.length == 0) {
                        this.defaultParams.typeMontag = this.typeMontag;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при загрузке размеров всасывающего патрубка:', error);
                });
        },
        loadTimeWork() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/time_work.php?application_id=${JSON.stringify(this.selectedApplication)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.timeWork = Object.values(data); // Обновляем массив мощностей
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.timeWork.length == 0) {
                        this.defaultParams.timeWork = this.timeWork;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при загрузке размеров всасывающего патрубка:', error);
                });
        },
        loadVsPopVikl() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/vs_pop_vikl.php?application_id=${JSON.stringify(this.selectedApplication)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.vsPopVikl = Object.values(data); // Обновляем массив мощностей
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.vsPopVikl.length == 0) {
                        this.defaultParams.vsPopVikl = this.vsPopVikl;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при загрузке размеров всасывающего патрубка:', error);
                });
        },
        loadVsPopViklQ() {
            fetch(`/product_selection_new/vs_pop_viklq.php?application_id=${JSON.stringify(this.selectedApplication)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.vsPopViklQ = Object.values(data); // Обновляем массив мощностей
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.vsPopViklQ.length == 0) {
                        this.defaultParams.vsPopViklQ = this.vsPopViklQ;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при загрузке размеров всасывающего патрубка:', error);
                });
        },
        loadPowers() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/powers.php?application_id=${JSON.stringify(this.selectedApplication)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.powers = Object.values(data); // Обновляем массив мощностей
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.powers.length == 0) {
                        this.defaultParams.powers = this.powers;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при загрузке мощностей:', error);
                });
        },
        loadPhaseCounts() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/phase_counts.php?application_id=${JSON.stringify(this.selectedApplication)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.phaseCounts = Object.values(data);
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.phaseCounts.length == 0) {
                        this.defaultParams.phaseCounts = this.phaseCounts;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при загрузке количеств фаз:', error);
                });
        },
        loadPoleCounts() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/pole_counts.php?application_id=${JSON.stringify(this.selectedApplication)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.poleCounts = Object.values(data);
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.poleCounts.length == 0) {
                        this.defaultParams.poleCounts = this.poleCounts;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при загрузке количеств полюсов:', error);
                });
        },
        loadManufacturers() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/manufacturers.php?application_id=${JSON.stringify(this.selectedApplication)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.manufacturers = Object.values(data);
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                })
                .catch(error => {
                    console.error('Ошибка при загрузке производителей:', error);
                });
        },
        updateApplications() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/applications.php?manufacturer_id=${JSON.stringify(this.selectedManufacturer)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    this.applications = Object.values(data); // Обновляем области применения на основе выбранного производителя
                    this.updateEquipmentTypes(); // Обновляем типы оборудования на основе новых областей применения
                })
                .catch(error => {
                    console.error('Ошибка при загрузке областей применения:', error);
                });
        },
        fetchBodyMaterial() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/body_material.php?custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.bodyMaterialCount = Object.values(data);
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.bodyMaterialCount.length == 0) {
                        this.defaultParams.bodyMaterialCount = this.bodyMaterialCount;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при получении материала корпуса:', error);
                });
        },
        fetchTypeMaterial() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/type_material.php?custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.typeMaterialCount = Object.values(data);
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                })
                .catch(error => {
                    console.error('Ошибка при получении материала рабочего колеса:', error);
                });
        },
        fetchWheelMaterial() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/wheel_material.php?custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.wheelMaterialCount = Object.values(data);
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.wheelMaterialCount.length == 0) {
                        this.defaultParams.wheelMaterialCount = this.wheelMaterialCount;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при получении материала рабочего колеса:', error);
                });
        },
        fetchMaxRabDav() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/max_dav.php?custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.wheelTypeCount = Object.values(data);
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.wheelTypeCount.length == 0) {
                        this.defaultParams.wheelTypeCount = this.wheelTypeCount;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при получении материала рабочего колеса:', error);
                });
        },
        fetchMaxRabDavFree() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/max_dav_free.php?custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.wheelTypeCountFree = Object.values(data);
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.wheelTypeCountFree.length == 0) {
                        this.defaultParams.wheelTypeCountFree = this.wheelTypeCountFree;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при получении материала рабочего колеса:', error);
                });
        },
        fetchWheelTypeOptions() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            //if (this.selectedEquipmentTypes.length > 0) {
            fetch(`/product_selection/wheel_type.php?equipment_type_ids=${JSON.stringify(this.selectedEquipmentTypes)}&custom=${JSON.stringify(custom)}`) // Замените на Ваш URL
                .then(response => response.json())
                .then(data => {
                    if (Object.values(data)) {
                        this.wheelTypeOptions = Object.values(data);
                    } else {
                        console.error('Ошибка: данные не являются массивом', data);
                    }
                    if (this.defaultParams.wheelTypeOptions.length == 0) {
                        this.defaultParams.wheelTypeOptions = this.wheelTypeOptions;
                    }
                })
                .catch(error => {
                    console.error('Ошибка при получении опций типа рабочего колеса:', error);
                });
            //} else {
            //    this.wheelTypeOptions = [];
            //}
        },
        analogInfo() {
            const urlParams = new URLSearchParams(window.location.search);
            const custom = urlParams.get('custom'); // вернёт строку или null
            fetch(`/product_selection/analogInfo.php?custom=${JSON.stringify(custom)}`) // Замените на Ваш URL для получения данных
                .then(response => response.json())
                .then(data => {
                    this.analogInfoBlock = data;
                })
                .catch(error => {
                    console.error('Ошибка при загрузке данных:', error);
                });
        },
        handleEquipmentTypeChange() {
            // Вызываем методы для получения материалов и типов колес при изменении типа оборудования
            //this.fetchWheelTypeOptions();
        },
        generateBackupPumpsOptions() {
            return Array.from({length: 10}, (_, index) => {
                const n = index + 1;
                return {
                    value: n,
                    //text: `${n} насос${n > 1 ? 'а' : ''}`
                    text: `${n}`
                };
            });
        },
        generateBackupPumpsOptionsZ() {
            return Array.from({length: 9}, (_, index) => {
                const n = index + 1;
                return {
                    value: n,
                    //text: `${n} насос${n > 1 ? 'а' : ''}`
                    text: `${n}`
                };
            });
        }
    },
    mounted() {
        if (this.wheelTypeCountFreeSorted.length) {
            this.sliderRange = [0, this.wheelTypeCountFreeSorted.length - 1];
        }
        this.restoreSort();
        this.applySort();
        this.filterSmartInfo(); // Вызов метода при монтировании компонента
        this.analogInfo(); // Вызов метода при монтировании компонента
        this.loadApplications(); // Вызов метода при монтировании компонента
        this.loadLiquidId(); // Вызов метода при монтировании компонента
        this.loadDischargeSizes(); // Загрузка размеров напорного патрубка
        this.loadSuctionSizes(); // Загрузка размеров всасывающего патрубка
        this.loadTypeMontag(); // Загрузка размеров всасывающего патрубка
        this.loadTimeWork(); // Загрузка размеров всасывающего патрубка
        this.loadVsPopVikl(); // Загрузка размеров всасывающего патрубка
        this.loadVsPopViklQ(); // Загрузка размеров всасывающего патрубка
        this.loadPowers(); // Загрузка мощностей
        this.loadPhaseCounts(); // Загрузка количеств фаз
        this.loadSizeTypes(); // Вызов метода при монтировании компонента
        this.loadServiceFactor(); // Вызов метода при монтировании компонента
        this.loadPoleCounts(); // Загрузка количеств полюсов
        this.loadManufacturers();
        this.fetchBodyMaterial();
        this.fetchWheelMaterial();
        this.fetchWheelTypeOptions();
        //this.fetchTypeMaterial();
        this.fetchMaxRabDav();
        this.fetchMaxRabDavFree();
        this.fetchNames();
        window.addEventListener("keydown", this.handleEnter);
        this.$nextTick(() => this.applyTwoLinesBalancedWidthFullScan());
        window.addEventListener("resize", this._onResize = () => {
            clearTimeout(this._rzT);
            this._rzT = setTimeout(() => this.applyTwoLinesBalancedWidthFullScan(), 100);
        });
    },
    beforeUnmount() {
        window.removeEventListener("keydown", this.handleEnter);
        clearTimeout(this._maxTempTimeout);
        window.removeEventListener("resize", this._onResize);
        clearTimeout(this._maxTempOutOfRangeTimer);
    },
    watch: {
        wheelTypeCountFreeSorted(newVal) {
            if (newVal.length && this.sliderRange[1] === 0) {
                this.sliderRange = [0, newVal.length - 1];
            }
        },
        maxWorkingPressureFreeFrom() { this.syncSliderFromSelects(); },
        maxWorkingPressureFreeTo()   { this.syncSliderFromSelects(); },
        displayData: {
            handler() {
                this.$nextTick(() => this.applyTwoLinesBalancedWidthFullScan());
            },
            deep: true,
        },
        tableHeaders() {
            this.$nextTick(() => this.applyTwoLinesBalancedWidthFullScan());
        },
        liquidValue() {
            this.concentrationValueID = getUFConcOptions(this.liquidCustomCon, this.liquidValue.id);
            this.concentrationValue = this.concentrationValueID[0];
            if(typeof this.concentrationValue != "undefined" && typeof this.liquidCustomCon[this.liquidValue.id]['UF_CONC'] != "undefined"){
                this.liquidValue.payload = this.liquidCustomCon[this.liquidValue.id]['UF_CONC'][this.concentrationValue.id]['UF_DENSITY'];
                this.liquidValue.payloadV = this.liquidCustomCon[this.liquidValue.id]['UF_CONC'][this.concentrationValue.id]['UF_NU'];
            }
            this.recalcDensity();
        },
        concentrationValue() {
            if(typeof this.concentrationValue != "undefined"){
                this.liquidValue.payload = this.liquidCustomCon[this.liquidValue.id]['UF_CONC'][this.concentrationValue.id]['UF_DENSITY'];
                this.liquidValue.payloadV = this.liquidCustomCon[this.liquidValue.id]['UF_CONC'][this.concentrationValue.id]['UF_NU'];
            }
            this.recalcDensity();
        },
        maxTempValue(newVal, oldVal) {
            // Если значение по сути не изменилось — ничего не делаем
            if (newVal === oldVal) return;

            // Очищаем предыдущий таймер
            clearTimeout(this._maxTempTimeout);

            // Нормализуем значение в число, но не насилуем сразу поле
            const t = Number(newVal);

            // 1) Игнорируем заведомо «незаконченные» состояния:
            //    - пустая строка
            //    - только "-"
            //    - только "."
            //    - "-."
            if (
                newVal === '' ||
                newVal === '-'
            ) {
                // Не вызываем recalcDensity, пока пользователь допечатывает
                return;
            }

            // 2) Если не число — тоже не дергаем расчет
            if (Number.isNaN(t)) return;

            // 3) Можно варьировать задержку: чем длиннее ввод, тем меньше задержка
            //    (опционально, можно оставить просто константу, например 400)
            const baseDelay = 400;
            const dynamicDelay = Math.max(200, baseDelay - String(newVal).length * 20);

            this._maxTempTimeout = setTimeout(() => {
                this.recalcDensity();
            }, dynamicDelay);
        },
        activeTab(newValue) {
            if (newValue === 'analog') {
                this.updateApplications(); // Загружаем области применения, когда активен таб "Подбор по аналогам"
                this.selectedManufacturer = {id: 'Grundfos', name: 'Grundfos'};
            }
            if (newValue === 'analog') {
                this.additionalParamsShow = false;
            } else {
                this.additionalParamsShow = true;
            }
        },
        selectedApplication(newValue) {
            this.updateEquipmentTypes(); // Обновляем типы оборудования при изменении области применения
        },
        selectedParallelConnection(newValue) {
            //this.updateBackupPumps();
            if (this.isUpdating) return;
            this.isUpdating = true;
            this.updateBackupPumps();
            this.$nextTick(() => { this.isUpdating = false; });
        },
        selectedBackupPumps(newValue) {
            //this.updateBackupPumpsZ();
            if (this.isUpdating) return;
            this.isUpdating = true;
            this.updateBackupPumpsZ();
            this.$nextTick(() => { this.isUpdating = false; });
        },
        selectedEquipmentTypes(newValue) {
            this.handleEquipmentTypeChange(); // Получаем новые данные при изменении типа оборудования
        },
    },
    beforeDestroy() {
    }
});
app.mount('#app');
