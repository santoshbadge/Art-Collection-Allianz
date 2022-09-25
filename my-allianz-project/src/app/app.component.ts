import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ArtServiceService } from './art-service.service';
import { ArtCollection } from './art.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Art Collection';
  artData: any;
  baseiiifURL: any;
  apiLink: any = [];
  finalGalleryData: ArtCollection[];
  unSubscribeArt: Subscription;
  page = 1;
  count = 0;
  perPage = 8;
  nextURL: string;
  prevURL: string;
  filterList: any = [];
  finalFilterList: any = [];
  selectedSort: string;
  selectedFilter: string;
  url = 'https://api.artic.edu/api/v1/artworks?limit=8';
  

  toText(value: string): string | null {
    return value ? value.toUpperCase() : null;
  }
  constructor(private artService: ArtServiceService) {
  }

  /* Ng Oninit Lifecycle hook */
  ngOnInit(): void {
    this.fetchData(this.url);
  }

  /* Function to fetch image details from service and create a list of objects with required properties*/
  fetchData(url: string) {
    this.unSubscribeArt = this.artService.getArtData(url).subscribe(
      (data: any) => {
        if (data) {
          this.artData = data;
          this.baseiiifURL = data.config.iiif_url;
          this.count = data.pagination.total;
          this.page = data.pagination.current_page;
          this.nextURL = data.pagination.next_url;
          this.prevURL = data.pagination.prev_url;
          this.finalGalleryData = [];
          this.apiLink = [];
          for (let i = 0; i < this.artData.data.length; i++) {
            this.finalGalleryData.push({
              image: '',  //https://upload.wikimedia.org/wikipedia/commons/3/32/Art_Institute_of_Chicago_logo.svg
              artWorkName: this.artData.data[i].artwork_type_title,
              artist: this.artData.data[i].artist_title,
              material: this.artData.data[i].medium_display,
              dateStart: this.artData.data[i].date_start,
              dateEnd: this.artData.data[i].date_end,
              location: this.artData.data[i].place_of_origin
            });


            let url = 'https://api.artic.edu/api/v1/artworks/' +
              this.artData.data[i].id +
              '?fields=id,title,image_id';

            this.apiLink.push(url);
            this.collectFilterByData(this.artData.data[i].style_titles, i);
          }

          for (let i = 0; i < this.apiLink.length; i++) {
            this.getImageURL(this.apiLink[i], this.finalGalleryData[i]);
          }
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }

  /* Function to get actual image URL */
  getImageURL(url: string, obj: any) {
    this.artService
      .getImageURL(url)
      .subscribe(
        (response: any) => {
          let url
          if (response && response.data.image_id) {
            url = this.baseiiifURL + '/' + response.data.image_id + '/full/843,/0/default.jpg'; // Actual Image
          } else {
            url = "https://upload.wikimedia.org/wikipedia/commons/3/32/Art_Institute_of_Chicago_logo.svg"; // Default image if actual image is not loaded
          }
          obj.image = url;
        },
        (err) => {
          console.log(err);
        }
      );
  }

  /* Function to prepare a list for Filter dropdown */
  collectFilterByData(titles: any, index: number) {
    for (let i = 0; i < titles.length; i++) {
      this.filterList.push(titles[i]);
    }
    let semiFilterList;
    if (index === this.perPage - 1 && this.filterList.length > 0) {
      const counts: any = {};
      this.filterList.forEach(function (x: any) { counts[x] = (counts[x] || 0) + 1; });
      semiFilterList = counts;
    
      this.finalFilterList = [];
      for (const key in semiFilterList) {

        this.finalFilterList.push(`${key} ${semiFilterList[key]}`);
      }   
    }
  }

  /* Function to fetch previous set of images from service */
  prevPage(): void {
    this.selectedFilter = '';  // Filter should be clear on page change
    this.fetchData(this.prevURL);
  }

  /* Function to fetch next set of images from service */
  nextPage(): void {
    this.selectedFilter = ''; // Filter should be clear on page change
    this.fetchData(this.nextURL);
  }

  /* Function to apply sort logic on images */
  applySort(): void {
    let url;
    if (this.selectedSort === 'Name') {
      url = this.url + "&sort=artist_id";
    } else if (this.selectedSort === 'Artist') {
      url = this.url + "&sort=artwork_type_id";
    } else {
      url = this.url + "&sort=date_start";
    }
    this.fetchData(url);
  }


  /* Function to apply filter logic on images */
  applyfilter(): void {
    let url = "https://api.artic.edu/api/v1/artworks?limit=8&query=" + this.selectedFilter;
    this.fetchData(url);
  }

  /* Ng Destroy Lifecycle hook */
  ngOnDestroy(): void {
    this.unSubscribeArt.unsubscribe();
  }
}
