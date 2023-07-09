import {AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import WebViewer, {Core, WebViewerInstance} from "@pdftron/webviewer";
import {Subject} from "rxjs";

@Component({
  selector: 'app-root',
  styleUrls: ['app.component.css'],
  templateUrl: 'app.component.html'
})
export class AppComponent implements AfterViewInit {
  wvInstance?: WebViewerInstance;
  
  @ViewChild('viewer') viewer!: ElementRef;
  
  @Output() coreControlsEvent:EventEmitter<string> = new EventEmitter();

  private documentLoaded$: Subject<void>;

  constructor() {
    this.documentLoaded$ = new Subject<void>();
  }

  ngAfterViewInit(): void {

    WebViewer({
      path: '../lib',
      enableOfficeEditing: true, 
      initialDoc: '../files/webviewer-demo-annotated.docx',
      licenseKey: 'your_license_key'  // sign up to get a free trial key at https://dev.apryse.com
    }, this.viewer.nativeElement).then(instance => {
      this.wvInstance = instance;

      this.coreControlsEvent.emit(instance.UI.LayoutMode.Single);
      instance.UI.enableFeatures([instance.UI.Feature.ContentEdit]);
      

      const { documentViewer, Annotations, annotationManager } = instance.Core;

      instance.UI.openElements(['notesPanel']);

      documentViewer.addEventListener('annotationsLoaded', () => {
        console.log('annotations loaded');
      });
      instance.UI.setHeaderItems(header => {
        header.push({
            type: 'actionButton',
            img: '...',
            onClick: async () => {
              const doc = documentViewer.getDocument();
              const xfdfString = await annotationManager.exportAnnotations();
              const options = {
                filename: 'myDocument.pdf',
                xfdfString,
                flags: Core.SaveOptions.LINEARIZED,
                downloadType: 'pdf'
              };
            instance.UI.downloadPdf(options);
            }
        });
      });
      documentViewer.addEventListener('documentLoaded', () => {
        this.documentLoaded$.next();
        const rectangleAnnot = new Annotations.RectangleAnnotation({
          PageNumber: 1,
          // values are in page coordinates with (0, 0) in the top left
          X: 100,
          Y: 150,
          Width: 200,
          Height: 50,
          Author: annotationManager.getCurrentUser()
        });
        annotationManager.addAnnotation(rectangleAnnot);
        annotationManager.redrawAnnotation(rectangleAnnot);
      });
    })
  }
}