export class CaravanItemModel extends foundry.abstract.TypeDataModel {
    prepareDerivedData() {
    }

    _recurseAttach = (obj, details) => {
        Object.entries(details).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                if (!obj[key]) {
                    obj[key] = [];
                }
                obj[key].push(...value);
            } else if (typeof value === "object") {
                if (!obj[key]) {
                    obj[key] = {};
                }
                this._recurseAttach(obj[key], value);
            } else {
                obj[key] = value ?? obj[key] ?? 0
            }
        });
    }
}