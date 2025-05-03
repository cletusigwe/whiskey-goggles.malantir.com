## What Is This?
I came across this [bounty](https://earn.superteam.fun/listing/whiskey-goggles/) and thought it would be fun to try it out. The [provided dataset](https://docs.google.com/spreadsheets/d/1sW-CJhdpAdXwCVkPo3J-zpmIjLAyVtyVYwkvoLPzr9w/edit?usp=sharing) only had single images for each whiskey so I scraped the internet for more images to complement. My scraping codes can be found in the `scraper.py` file in this [gist](https://gist.github.com/cletusigwe/e4c6b30c43fa8563fc574452d18cd011).

I then built a [ui]() to use to filter out the bad images, and organise my dataset. 

Next, I modified `siglip-base-patch16-224` which is one of the collections of the multimodal models using the [SigLip](https://huggingface.co/docs/transformers/main/en/model_doc/siglip) architecture and used it to train a classifier for the whiskey bottles. I chose SigLip because I originally planned to use [moondream2](https://huggingface.co/vikhyatk/moondream2) but found out that it didnt do straight shot classification. Looking into moondream2's architectural components was what led me to SigLip.

I then trained a classification model on my dataset (which can be found in this [zip file](https://drive.google.com/file/d/1IZdqRWjzVM5acwfhpxi3UQtC5Lx_3rDr/view?usp=sharing)) using google colab. The training code can be found in the `train.py` file of this [gist](https://gist.github.com/cletusigwe/e4c6b30c43fa8563fc574452d18cd011). The final training accuracy was around 60%, which is somewhat manageable.

I then built a [webapp]() that allows users to classify bottles from their images, edit their properties while also building a better dataset for "whiskey-label -> name" dataset.

This repository contains the code for this webapp I built.

Here is a [demo video on my youtube channel]().