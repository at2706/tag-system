class TagSystem {
    constructor(args) {
        /*
            Properties
                inputElement = search bar
                outputElement = Container for buttons
                suggestionsElement = Container for buttons
                dataElement (optional) = hidden data
                outputButton (optional) = button Element
                suggestionsButton (optional) = button Element
                
                url = ajax target
                method (optional) = GET or POST (default: POST)
                autocomplete (optional) = boolean. Select first suggestion on KEY
                keys (optional) = Char to trigger tag creation
                delimiter (optional) = Char to seperate data (default: ',')
        */

        this.delimiter = ',';
        //Characters at the end of the String that triggers tag creation
        this.keys = [';', ','];

        for(var key in args) {
            this[key] = args[key];
        }
        this.inputElement.autocomplete = "off";
        this.inputElement.oninput = this.update.bind(this);

        var form = $(this.inputElement).parents('form')[0];
        if(!("dataElement" in this)) {
            this.dataElement = document.createElement("input");
            this.dataElement.type = "hidden";
            this.dataElement.name = "search";

            form.appendChild(this.dataElement);
        }

        if(!("outputButton" in this)) {
            this.outputButton = document.createElement("div");
            this.outputButton.className = "btn btn-info btn-sm";
        }

        if(!("suggestionsButton" in this)) {
            this.suggestionsButton = document.createElement("div");
            this.suggestionsButton.className = "btn btn-success btn-sm";
        }
    }

    update() {
        // Everything in the input field, with spaces replaced with dashes
        var input = this.inputElement.value.replace(/ /g, '-').toLowerCase();
        // Existing data
        var data = this.dataElement.value.split(this.delimiter);

        // If the text is empty (to prevent negative substring index, triggers when deleting)
        // or the input is a KEY character
        if(input.length == 0 || $.inArray(input, this.keys) == 0){
            // Clear input and suggests. Do nothing.
            this.inputElement.value = '';
            while (this.suggestionsElement.firstChild) {
                this.suggestionsElement.removeChild(this.suggestionsElement.firstChild);
            }
            return;
        }

        // If the last character is one of the KEY character
        if($.inArray(input.substr(-1), this.keys) >= 0){
            // Remove KEY character
            var text = input.substr(0, input.length - 1);

            // If the tag already exists, clear input field and do nothing
            if($.inArray(text, data) >= 0)
                this.inputElement.value = '';

            else if(this.autocomplete) {
                // Pick the first suggestion
                if(this.suggestionsElement.firstChild)
                    this.suggestionsElement.firstChild.click();
            }
            else {
                this.create_tag(text, text);
            }
            this.inputElement.value = '';
            while (this.suggestionsElement.firstChild) {
                this.suggestionsElement.removeChild(this.suggestionsElement.firstChild);
            }
            return;
        }

        $.ajax({
            method: this.method || "POST",
            url: this.url,
            data: { 'input': input, 'data': data.toString() },
            tags: this,
            success: function(result, status, xhr) {
                $(this.tags.suggestionsElement).empty();
                var data = result.content['data'];
                var labels = result.content['labels'] || [];
                for (var i = 0; i < data.length; ++i) {
                    var btn = this.tags.suggestionsButton.cloneNode();
                    btn.tags = this.tags;
                    btn.value = data[i];
                    btn.textContent = labels[i] || data[i];
                    btn.onclick = this.tags.add_tag;
                    this.tags.suggestionsElement.appendChild(btn);
                }
            },
            error: function(xhr, status, error) {
                alert("Error: " + xhr.responseText);
            },
        });
    };

    create_tag(data, label) {
        var val = this.dataElement.value;
        if(val == '')
            val += data;
        else
            val += this.delimiter + data;
        this.dataElement.value = val;

        var tag = this.outputButton.cloneNode();
        //Capitalize First letters of words
        var words = data.split('-');
        var formatted_data = '';
        for(var i = 0; i < words.length; i++) {
            formatted_data += words[i].charAt(0).toUpperCase() + words[i].substr(1) + '-';
        }
        tag.value = data;
        tag.textContent = label || data;
        tag.tags = this;
        tag.onclick = this.remove_tag;
        this.outputElement.appendChild(tag);
    }

    add_tag() {
        this.tags.create_tag(this.value, this.textContent);
        $(this.tags.suggestionsElement).empty();
        this.tags.inputElement.value = '';
        this.remove();
    }

    remove_tag() {
        var data = this.tags.dataElement.value;
        var cut = data.split(this.tags.delimiter);
        var index = cut.indexOf(this.value.toLowerCase());
        if (index !== -1)
            cut.splice(index, 1);
        this.tags.dataElement.value = cut;
        this.remove();
    }

};
