export default `
@use './common.spec' as TemplateType;
$CAPTION: Υπεύθυνη Δήλωση;
$DEFAULT_MODE_LANG: default/el;
$INTRO_TEXT: 'Με ατομική μου ευθύνη και γνωρίζοντας τις κυρώσεις<sup>(2)</sup>,';

.common_step_props {
  .display {
    captionLeft: $CAPTION;
  }
}


.Ypdil[TemplateType] {

  .steps {
    .personal {
      @include .common_step_props;
      fieldset-order: personal address contact;
      
      action-order: update;
      .display {
        component: string;
        title: Στοιχεία Δηλούντος;
      }
    }
    .body {
      @include common.BODY;
      .fieldsets {
        .default {
          .introduction {
            value: $INTRO_TEXT;
            .display {
              .default {
                @include components.string;
              }
              .pdf {
                title: Something;
              }
            }
          }
          .free_text {
            user-input-mode: required;
            .display {
              component: text;
              .params {
                format: text;
              }
            }
          }
        }
      }
    }
  }
  steps-orderz: personal body;
} `;
