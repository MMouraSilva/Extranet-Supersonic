function selectStateAndCity(stateSelectId, citySelectId) {
    $.getJSON('/plugins/combo-dinamico/estados_cidades.json', function (data) {

        var items = [];
        var options = '<option value="">Escolha um Estado</option>';

        $.each(data, function (key, val) {
            options += '<option value="' + val.nome + '">' + val.nome + '</option>';
        });
        $("#" + stateSelectId).html(options);

        $("#" + stateSelectId).change(function () {

            var options_cidades = '';
            var str = "";

            $("#" + stateSelectId + " option:selected").each(function () {
                str += $(this).text();
            });

            $.each(data, function (key, val) {
                if (val.nome == str) {
                    $.each(val.cidades, function (key_city, val_city) {
                        options_cidades += '<option value="' + val_city + '">' + val_city + '</option>';
                    });
                }
            });

            $("#" + citySelectId).html(options_cidades);

        }).change();

    });
}