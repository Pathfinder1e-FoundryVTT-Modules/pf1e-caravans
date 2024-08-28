export class WagonModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            subType: new fields.StringField({required: true, default: "coveredWagon"}),
            details: new fields.SchemaField({
                description: new fields.SchemaField({
                    value: new fields.StringField({required: true, default: ""}),
                })
            })
        };
    }

    prepareDerivedData() {
        this._mergeWagonDetails();
    }

    _mergeWagonDetails() {
        const wagonDetails = pf1.registry.wagonTypes.get(this.subType) ?? {
            capacity: {
                passengers: 0,
                cargo: 0
            }
        };
        const recurseAttach = (obj, details) => {
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
                    recurseAttach(obj[key], value);
                } else {
                    obj[key] = value;
                }
            });
        }
        recurseAttach(this, wagonDetails);
    }
}