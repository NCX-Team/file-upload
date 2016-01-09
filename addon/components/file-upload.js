import Ember from 'ember';

export default Ember.Component.extend({
  drop_enabled: false,
  drag_in_element: false,
  type_match: /image.*/,
  classNameBindings: ['drag_in_element:entered', 'uploading:uploading'],

  init: function() {
    this._super();
    if (!this.get("url")) {
      return Ember.Logger.warn("missing required url parameter for file upload component");
    }
  },

  actions: {
    upload: function() {
      if (this.get('uploading')) {
        return;
      }
      return this.$("[name=file]").click();
    }
  },

  didInsertElement: function() {
    $("[name=file]").on("change", $.proxy(this.submit, this));
    if (this.get("drop_enabled")) {
      this.$().on("dragenter dragover", $.proxy(this.dragenter, this));
      this.$().on("drop", $.proxy(this.drop, this));

      return $(document).on('dragenter dragover drop', $.proxy(this.outside, this));
    }
  },

  willDestroyElement: function() {
    this.$().off("dragenter");
    this.$().off("dragleave");
    this.$().off("drop");

    return $(document).off('dragenter dragover drop', $.proxy(this.outside, this));
  },

  submit: function() {
    if ($.trim(this.$("[name=file]").val()).length) {
      this.set('uploading', true);
      this.sendAction("start");
      return this.$("form").ajaxSubmit({
        success: $.proxy(this.submit_success, this),
        error: $.proxy(this.submit_error, this)
      });
    }
  },

  submit_success: function(data) {
    this.set('uploading', false);
    this.$("[name=file]").val("");
    return this.sendAction("success", data);
  },

  submit_error: function(XHR, text, error) {
    this.set('uploading', false);
    this.$("[name=file]").val("");
    return this.sendAction("error", XHR, text, error);
  },

  ignore: function(event) {
    event.stopPropagation();
    return event.preventDefault();
  },

  outside: function(event) {
    this.ignore(event);
    return this.set('drag_in_element', false);
  },

  dragenter: function(event) {
    this.ignore(event);
    return this.set('drag_in_element', true);
  },

  drop: function(event) {
    var file, files, reader;
    if (this.get('uploading')) {
      return;
    }

    this.ignore(event);
    this.set('drag_in_element', false);
    files = (event.originalEvent || event).dataTransfer.files;
    if (!files.length) {
      return;
    }

    file = files[0];
    if (file.size <= 0) {
      alert('Unable to upload an empty file');
      return;
    }

    if (this.get('type_match') && !file.type.match(this.get('type_match'))) {
      alert('File must be an image');
      return;
    }

    this.set('uploading', true);
    this.sendAction("start");
    this.$("[name=file]").val("");
    reader = new FileReader();
    reader.onload = (function(_this) {
      return function(event) {
        var form_data;
        form_data = new FormData(_this.$("form")[0]);
        form_data.append('file', file);
        return $.ajax({
          url: _this.get('url'),
          type: 'POST',
          processData: false,
          contentType: false,
          data: form_data,
          success: $.proxy(_this.submit_success, _this),
          error: $.proxy(_this.submit_error, _this)
        });
      };
    })(this);

    return reader.readAsBinaryString(file);
  }
});
