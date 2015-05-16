///<reference path="../../reference.ts" />

module Plottable {

  export class Stacked<X, Y> extends XYPlot<X, Y> {
    protected _isVertical: boolean;

    public _updateStackOffsets() {

      if (!this._projectorsReady()) {
        return;
      }

      var orientation = this._isVertical ? "vertical" : "horizontal";
      var keyAccessor = StackedPlotUtils.keyAccessor(this, orientation);
      var valueAccessor = StackedPlotUtils.valueAccessor(this, orientation);
      var datasetKeys = this._datasetKeysInOrder;
      var keyToPlotDatasetKey = this._key2PlotDatasetKey;
      var domainKeys = StackedPlotUtils.getDomainKeys(keyAccessor, datasetKeys, keyToPlotDatasetKey);
      var filter = this._filterForProperty(this._isVertical ? "y" : "x");

      var dataMapArray = StackedPlotUtils.generateDefaultMapArray
        (keyAccessor, valueAccessor, domainKeys, datasetKeys, keyToPlotDatasetKey);

      var positiveDataMapArray: D3.Map<Plots.StackedDatum>[] = dataMapArray.map((dataMap) => {
        return Utils.Methods.populateMap(domainKeys, (domainKey) => {
          return { key: domainKey, value: Math.max(0, dataMap.get(domainKey).value) || 0 };
        });
      });

      var negativeDataMapArray: D3.Map<Plots.StackedDatum>[] = dataMapArray.map((dataMap) => {
        return Utils.Methods.populateMap(domainKeys, (domainKey) => {
          return { key: domainKey, value: Math.min(dataMap.get(domainKey).value, 0) || 0 };
        });
      });

      var stackOffsets = StackedPlotUtils.generateStackOffsets(
        StackedPlotUtils.stack(positiveDataMapArray, domainKeys),
        StackedPlotUtils.stack(negativeDataMapArray, domainKeys),
        keyAccessor,
        valueAccessor,
        datasetKeys,
        keyToPlotDatasetKey);

      for (var datasetKey in stackOffsets) {
        var plotMetadata = <Plots.StackedPlotMetadata> this._key2PlotDatasetKey.get(datasetKey).plotMetadata;
        plotMetadata.offsets = stackOffsets[datasetKey];
      }

      // this._stackedExtent = Stacked.prototype._updateStackExtents(keyAccessor, valueAccessor, datasetKey, keyToPlotDatasetKey, filter);
    }

    public _updateStackExtents(
        keyAccessor: Accessor<any>,
        valueAccessor: Accessor<any>,
        datasetKeys: string[],
        keyToPlotDatasetKey: D3.Map<Plots.PlotDatasetKey>,
        filter: Accessor<boolean>) {
      // var orientation = this._isVertical ? "vertical" : "horizontal";
      // var keyAccessor = StackedPlotUtils.keyAccessor(this, orientation);
      // var valueAccessor = StackedPlotUtils.valueAccessor(this, orientation);

      // var datasetKeys = this._datasetKeysInOrder;
      // var keyToPlotDatasetKey = this._key2PlotDatasetKey;
      // var filter = this._filterForProperty(this._isVertical ? "y" : "x");

      console.log(valueAccessor);


      var maxStackExtent = Utils.Methods.max<string, number>(datasetKeys, (k: string) => {
        var dataset = keyToPlotDatasetKey.get(k).dataset;
        var plotMetadata = <Plots.StackedPlotMetadata>keyToPlotDatasetKey.get(k).plotMetadata;
        var data = dataset.data();
        if (filter != null) {
          data = data.filter((d, i) => filter(d, i, dataset, plotMetadata));
        }
        return Utils.Methods.max<any, number>(data, (datum: any, i: number) => {
          return +valueAccessor(datum, i, dataset, plotMetadata) +
            plotMetadata.offsets.get(String(keyAccessor(datum, i, dataset, plotMetadata)));
        }, 0);
      }, 0);

      var minStackExtent = Utils.Methods.min<string, number>(datasetKeys, (k: string) => {
        var dataset = keyToPlotDatasetKey.get(k).dataset;
        var plotMetadata = <Plots.StackedPlotMetadata>keyToPlotDatasetKey.get(k).plotMetadata;
        var data = dataset.data();
        if (filter != null) {
          data = data.filter((d, i) => filter(d, i, dataset, plotMetadata));
        }
        return Utils.Methods.min<any, number>(data, (datum: any, i: number) => {
          return +valueAccessor(datum, i, dataset, plotMetadata) +
            plotMetadata.offsets.get(String(keyAccessor(datum, i, dataset, plotMetadata)));
        }, 0);
      }, 0);

      return [Math.min(minStackExtent, 0), Math.max(0, maxStackExtent)];
    }
  }
}
