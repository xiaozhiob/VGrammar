import { merge, throttle } from '@visactor/vutils';
import type {
  ViewRoamOptions,
  IView,
  InteractionEvent,
  IScale,
  IData,
  IViewZoomMixin,
  IViewScrollMixin,
  IViewDragMixin,
  InteractionEventHandler
} from '../types';
import { ViewNavigationBase } from './view-navigation-base';

export interface ViewRoam
  extends Pick<IViewDragMixin, 'handleDragStart' | 'handleDragEnd' | 'handleDragUpdate'>,
    Pick<IViewScrollMixin, 'formatScrollEvent' | 'handleScrollStart' | 'handleScrollEnd'>,
    Pick<
      IViewZoomMixin,
      'formatZoomEvent' | 'handleZoomStart' | 'handleZoomEnd' | 'handleZoomReset' | 'updateZoomRange'
    >,
    ViewNavigationBase<ViewRoamOptions> {}

export class ViewRoam extends ViewNavigationBase<ViewRoamOptions> {
  static type: string = 'view-roam';
  type: string = ViewRoam.type;

  static defaultOptions: ViewRoamOptions = {
    zoom: {
      realtime: true,
      enable: true,
      focus: true,
      trigger: 'wheel',
      endTrigger: 'pointerup',
      triggerOff: 'dblclick',
      rate: 1
    },
    scroll: {
      realtime: true,
      enable: false,
      reversed: false,
      trigger: 'wheel',
      endTrigger: 'pointerup'
    },
    drag: {
      realtime: true,
      enable: true,
      reversed: false,
      trigger: 'pointerdown',
      updateTrigger: 'pointermove',
      endTrigger: 'pointerup'
    },
    throttle: 100
  };

  protected _inited?: boolean;
  protected _lastScale: number;
  protected _scaleX: IScale;
  protected _scaleY: IScale;
  protected _data: IData;
  protected handleRoamZoomStart: (e: InteractionEvent) => void;
  protected handleRoamDragUpdate: (e: InteractionEvent) => void;
  protected handleRoamScrollStart: (e: InteractionEvent) => void;
  protected _isDragStarted?: boolean;
  protected _isScrollStarted?: boolean;
  protected _isZoomStarted?: boolean;

  constructor(view: IView, option?: ViewRoamOptions) {
    super(view, merge({}, ViewRoam.defaultOptions, option));
    this.handleRoamZoomStart = throttle(this.handleRoamZoomStartInner, this.options.throttle);
    this.handleRoamDragUpdate = throttle(this.handleRoamDragUpdateInner, this.options.throttle);
    this.handleRoamScrollStart = throttle(this.handleRoamScrollStartInner, this.options.throttle);
  }

  protected getEvents() {
    const events: Array<{ type: string; handler: InteractionEventHandler }> = [];

    if (this.options.zoom?.enable) {
      this.options.zoom.trigger && events.push({ type: this.options.zoom.trigger, handler: this.handleRoamZoomStart });
      this.options.zoom.endTrigger &&
        events.push({ type: this.options.zoom.endTrigger, handler: this.handleRoamZoomEnd });
      this.options.zoom.triggerOff &&
        events.push({ type: this.options.zoom.triggerOff, handler: this.handleRoamZoomReset });
    }

    if (this.options.scroll?.enable) {
      this.options.scroll.trigger &&
        events.push({ type: this.options.scroll.trigger, handler: this.handleRoamScrollStart });
      this.options.scroll.trigger &&
        events.push({ type: this.options.scroll.endTrigger, handler: this.handleRoamScrollEnd });
    }

    if (this.options.drag?.enable) {
      this.options.drag.trigger && events.push({ type: this.options.drag.trigger, handler: this.handleRoamDragStart });
      this.options.drag.updateTrigger &&
        events.push({ type: this.options.drag.updateTrigger, handler: this.handleRoamDragUpdate });
      this.options.drag.endTrigger &&
        events.push({ type: this.options.drag.endTrigger, handler: this.handleRoamDragEnd });
    }

    return events;
  }

  handleRoamZoomStartInner = (e: InteractionEvent) => {
    this.formatZoomEvent(e);
    if (!e || (this.options.shouldStart && !this.options.shouldStart(e))) {
      return;
    }

    if (!this._inited) {
      this._initGrammars();
    }

    this._isZoomStarted = true;

    this.updateView('start', this.handleZoomStart(e, this._state, this.options.zoom), 'zoom', e);
  };

  handleRoamZoomEnd = (e: InteractionEvent) => {
    if (!this._isZoomStarted) {
      return;
    }

    this.formatZoomEvent(e);
    if (!e || (this.options.shouldEnd && !this.options.shouldEnd(e))) {
      return;
    }

    this.updateView('end', this.handleZoomEnd(e, this._state, this.options.zoom), 'zoom', e);
    this._isZoomStarted = false;
  };

  handleRoamZoomReset = (e: InteractionEvent) => {
    if (!this._isZoomStarted || !e || (this.options.shouldReset && !this.options.shouldReset(e))) {
      return;
    }
    this.updateView('reset', this.handleZoomReset(e, this._state, this.options.zoom), 'zoom', e);
    this._isZoomStarted = false;
  };

  handleRoamDragStart = (e: InteractionEvent) => {
    if (!e || (this.options.shouldStart && !this.options.shouldStart(e))) {
      return;
    }

    if (!this._inited) {
      this._initGrammars();
    }
    this._isDragStarted = true;

    this.updateView('start', this.handleDragStart(e, this._state, this.options.drag), 'drag', e);
  };

  handleRoamDragUpdateInner = (e: InteractionEvent) => {
    if (!this._isDragStarted || !e || (this.options.shouldUpdate && !this.options.shouldUpdate(e))) {
      return;
    }
    this.updateView('update', this.handleDragUpdate(e, this._state, this.options.drag), 'drag', e);
  };

  handleRoamDragEnd = (e: InteractionEvent) => {
    if (!this._isDragStarted || !e || (this.options.shouldEnd && !this.options.shouldEnd(e))) {
      return;
    }

    this.updateView('end', this.handleDragEnd(e, this._state, this.options.drag), 'drag', e);
    this._isDragStarted = false;
  };

  handleRoamScrollStartInner = (e: InteractionEvent) => {
    this.formatScrollEvent(e);
    if (!e || (this.options.shouldStart && !this.options.shouldStart(e))) {
      return;
    }

    if (!this._inited) {
      this._initGrammars();
    }
    this._isScrollStarted = true;

    this.updateView('start', this.handleScrollStart(e, this._state, this.options.scroll), 'scroll', e);
  };

  handleRoamScrollEnd = (e: InteractionEvent) => {
    if (!this._isScrollStarted) {
      return;
    }

    this.formatScrollEvent(e);
    if (!e || (this.options.shouldEnd && !this.options.shouldEnd(e))) {
      return;
    }

    this.updateView('end', this.handleScrollEnd(e, this._state, this.options.scroll), 'scroll', e);
    this._isScrollStarted = true;
  };
}
