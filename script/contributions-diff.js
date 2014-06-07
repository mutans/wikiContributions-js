// Copyright VOGG 2013
function strip_tags(input, allowed) {
  // http://kevin.vanzonneveld.net
  allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
  var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
  return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
    return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
  });
}

function getDiff(text1, text2) {
  var dmp = new diff_match_patch();
  var res = dmp.diff_main(strip_tags(text1), strip_tags(text2));
  dmp.diff_cleanupSemantic(res);

  $("#contr_value").text("Levenshtein distance value: " + dmp.diff_levenshtein(res));


  //Detect moved sentences
  sentence_objects = find_moved_sentences(strip_tags(text1),strip_tags(text2));
  $("#sentences_moved").html("&nbsp;&nbsp;&nbsp;Moved sentences: " + sentence_objects.length);

  console.log(strip_tags(text1));
  for (_i = 0, _len = sentence_objects.length; _i < _len; _i++) {
    sentence = sentence_objects[_i];
    res.push([2,sentence.sentence]);
  }
  return dmp.diff_prettyHtml(res);
}



function find_moved_sentences(text_1, text_2) {
    var sentences_1 = find_sentences(text_1);
    var sentences_2 = find_sentences(text_2);
    var sentences_1_post_first_processing = [];
    var sentences_2_post_first_processing = [];
    var sentences_1_post_second_processing = [];
    var sentences_2_post_second_processing = [];
    var moved_sentences = [];
    var ignored_sentences = [];
    var current_index = 0;
    //Remove deleted sentences
    for (var _i = 0, _len = sentences_1.length; _i < _len; _i++) {
        current_sentence = sentences_1[_i];
        var current_sentence_exists_in_2nd_list = false;
        
        for (var _j = 0, _len_2 = sentences_2.length; _j < _len_2; _j++) {
                current_sentence_2 = sentences_2[_j];
                if(current_sentence.sentence === current_sentence_2.sentence){
                    current_sentence_exists_in_2nd_list = true;
                }

        }
        
        if (current_sentence_exists_in_2nd_list === true){
           sentences_1_post_first_processing.push(current_sentence);

        }
    }



    //Remove added sentences
    for (_i = 0, _len = sentences_2.length; _i < _len; _i++) {
        current_sentence = sentences_2[_i];
        var current_sentence_added_in_2nd_text = true;
        for (_j = 0, _len_2 = sentences_1_post_first_processing.length; _j < _len_2; _j++) {
                current_sentence_2 = sentences_1_post_first_processing[_j];
                if(current_sentence.sentence == current_sentence_2.sentence){
                    current_sentence_added_in_2nd_text = false;
                    break;
                }

        }
        if (current_sentence_added_in_2nd_text === false){
           sentences_2_post_first_processing.push(current_sentence);
        }
    }

    //Remove sentences of less than length 5.
    for (var _i = 0, _len = sentences_1_post_first_processing.length; _i < _len; _i++) {
        current_sentence = sentences_1_post_first_processing[_i];
        
        if (current_sentence.sentence.length >= 5){
            sentences_1_post_second_processing.push(current_sentence);
            
        }
    }
    //Remove sentences of less than length 5.
    for (_i = 0, _len = sentences_2_post_first_processing.length; _i < _len; _i++) {
        current_sentence = sentences_2_post_first_processing[_i];
        if (current_sentence.sentence.length >= 5){
            sentences_2_post_second_processing.push(current_sentence);
        }
    }



    //Create final array
    return find_moved_sentences_recursive(sentences_1_post_second_processing, sentences_2_post_second_processing, moved_sentences);


} ;


function find_sentences(text_to_find_sentences_in) {
    /*
    Cas couverts :
    - Une phrase peut contenir un mot contenant une majucule.
    - Une phrase qui contient un mot contenant une majuscule ne perçoit pas ce mot comme un nouveau début de phrase.
    - Une phrase qui contient un mot contenant une point suivit d'une lettre (pour énumération) n'est perçus comme une fin de phrase.

    Cas non-couverts : 
    - Une phrase n'est pas considérée comme une phrase si elle contient moins de cinq lettres, mais cela est fait au niveau de la fonction qui l'appelle.

    */
    var regex_to_find_sentences = /([^a-zA-Z0-9] ?)([A-Z].+?[\.!\?]+)/g;
    var sentence_regex_match = regex_to_find_sentences.exec(text_to_find_sentences_in);
    var sentences_found = [];
    var sentence_object, prefix_to_sentence, sentence_found;
    while (sentence_regex_match !== null) {
        sentence_object = {};
        prefix_to_sentence = sentence_regex_match[1];
        sentence_found = sentence_regex_match[2];
        sentence_object.sentence = sentence_found;
        //find sentence index without prefix:
        sentence_object.index = sentence_regex_match.index + prefix_to_sentence.length;

        sentences_found.push(sentence_object);
        sentence_regex_match = regex_to_find_sentences.exec(text_to_find_sentences_in);
    }

    return sentences_found;

} ;
function find_moved_sentences_recursive(sentences_1, sentences_2, final_array){
    var current_sentence = sentences_1[0];

    for (_i = 0, _len = sentences_2.length; _i < _len; _i++) {
          current_sentence_2 = sentences_2[_i];
          if (current_sentence.sentence === current_sentence_2.sentence) {
              if(_i !== 0){

                  var sentence_object_to_add_to_final_array = current_sentence;
                  sentence_object_to_add_to_final_array.index_new = current_sentence_2.index;
                  final_array.push(sentence_object_to_add_to_final_array);
              }

              sentences_1.splice(0, 1);
              sentences_2.splice(_i,1);
              break;
          };
    }
    if (sentences_1.length !== 0){
        final_array = find_moved_sentences_recursive(sentences_1,sentences_2, final_array);
    }
    return final_array;

}



 