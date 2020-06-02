module.exports = class Util {
    static equalArrays(first, second) {
        return this.arrayContainsArray(first, second, true);
    }

    static arrayContainsArray(superset, subset, equality = false) {
        if (equality) {
            if (superset.length !== subset.length) {
                return false;
            }
        } else {
            if (subset.length === 0 || superset.length < subset.length) {
                return false;
            }
        }
        for (let i = 0; i < subset.length; i++) {
            if (superset.indexOf(subset[i]) === -1) {
                return false;
            }
            if (equality) {
                if (superset[i] !== subset[i]) {
                    return false;
                }
            }
        }
        return true;
    }

    static isObject(obj) {
        return typeof(obj) === 'object' && !Array.isArray(obj);
    }

    static isOperator(key) {
        return key.substr(0, 1) === '$';
    }

    static hasKeys(obj) {
        if (!this.isObject(obj)) {
            return false;
        }

        return Object.keys(obj).length ? true : false;
    }

    static deleteObjectProps(src, propsObj) {
        if (!this.isObject(src) || !this.hasKeys(propsObj)) {
            return;
        }

        const keys = Object.keys(propsObj);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key === '_id' || key === 'iat') {
                continue;
            }
            delete src[key];
        }

        return src;
    }
}